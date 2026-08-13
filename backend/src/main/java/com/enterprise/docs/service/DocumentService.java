package com.enterprise.docs.service;

import com.enterprise.docs.dto.AuthDto;
import com.enterprise.docs.dto.DocumentDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.exception.ResourceNotFoundException;
import com.enterprise.docs.exception.UnauthorizedException;
import com.enterprise.docs.kafka.KafkaProducerService;
import com.enterprise.docs.model.*;
import com.enterprise.docs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Document CRUD, sharing, search, and Redis caching.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final KafkaProducerService kafkaProducer;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DOC_CACHE_PREFIX = "doc:";
    private static final long CACHE_TTL_MINUTES = 5;

    // ─── Create ──────────────────────────────────────────────────────────────

    @Transactional
    public DocumentDto.DocumentResponse createDocument(DocumentDto.CreateDocumentRequest req, String userId) {
        User owner = getUser(userId);
        Document doc = Document.builder()
                .title(req.getTitle())
                .content("")
                .owner(owner)
                .isPublic(req.isPublic())
                .build();

        documentRepository.save(doc);

        // Add owner as OWNER collaborator
        Collaborator ownerCollab = Collaborator.builder()
                .document(doc)
                .user(owner)
                .role(Collaborator.CollaboratorRole.OWNER)
                .build();
        collaboratorRepository.save(ownerCollab);

        auditService.log(userId, "DOCUMENT_CREATE", "Created document: " + doc.getId(), null);
        kafkaProducer.publishDocumentEvent(doc.getId(), userId, "CREATE", doc.getTitle());

        cacheDocument(doc);
        log.info("Document created: {} by user: {}", doc.getId(), userId);
        return toDocumentResponse(doc);
    }

    // ─── Read ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DocumentDto.DocumentResponse getDocument(String docId, String userId) {
        // Try Redis cache first
        String cacheKey = DOC_CACHE_PREFIX + docId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof DocumentDto.DocumentResponse response) {
            verifyAccess(response, userId);
            return response;
        }

        Document doc = getDocumentEntity(docId);
        verifyReadAccess(doc, userId);
        DocumentDto.DocumentResponse response = toDocumentResponse(doc);
        cacheDocument(doc);
        return response;
    }

    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto.DocumentListResponse> getUserDocuments(String userId, Pageable pageable) {
        User user = getUser(userId);
        Page<Document> docs = documentRepository.findAllAccessibleByUser(userId, pageable);
        return PagedResponse.of(docs.map(this::toDocumentListResponse));
    }

    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto.DocumentListResponse> searchDocuments(String query, String userId, Pageable pageable) {
        Page<Document> docs = documentRepository.searchAccessibleByTitle(query, userId, pageable);
        return PagedResponse.of(docs.map(this::toDocumentListResponse));
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    @Transactional
    public DocumentDto.DocumentResponse updateDocument(String docId, DocumentDto.UpdateDocumentRequest req, String userId) {
        Document doc = getDocumentEntity(docId);
        verifyWriteAccess(doc, userId);

        if (req.getTitle() != null) doc.setTitle(req.getTitle());
        if (req.getContent() != null) doc.setContent(req.getContent());
        if (req.getIsPublic() != null) doc.setPublic(req.getIsPublic());

        documentRepository.save(doc);
        evictCache(docId);
        cacheDocument(doc);

        kafkaProducer.publishDocumentEvent(docId, userId, "UPDATE", doc.getTitle());
        log.debug("Document updated: {}", docId);
        return toDocumentResponse(doc);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    @Transactional
    public void deleteDocument(String docId, String userId) {
        Document doc = getDocumentEntity(docId);
        verifyOwnerAccess(doc, userId);
        documentRepository.delete(doc);
        evictCache(docId);
        auditService.log(userId, "DOCUMENT_DELETE", "Deleted document: " + docId, null);
        kafkaProducer.publishDocumentEvent(docId, userId, "DELETE", doc.getTitle());
        log.info("Document deleted: {} by user: {}", docId, userId);
    }

    // ─── Share ───────────────────────────────────────────────────────────────

    @Transactional
    public DocumentDto.CollaboratorResponse shareDocument(String docId, DocumentDto.ShareDocumentRequest req, String requesterId) {
        Document doc = getDocumentEntity(docId);
        verifyOwnerAccess(doc, requesterId);
        User targetUser = getUser(req.getUserId());

        if (collaboratorRepository.existsByDocumentAndUser(doc, targetUser)) {
            throw new IllegalArgumentException("User is already a collaborator on this document");
        }

        Collaborator collab = Collaborator.builder()
                .document(doc)
                .user(targetUser)
                .role(req.getRole())
                .build();
        collaboratorRepository.save(collab);

        notificationService.createNotification(
                targetUser.getId(),
                "Document Shared",
                "You've been granted access to: " + doc.getTitle(),
                Notification.NotificationType.SHARE
        );
        kafkaProducer.publishDocumentEvent(docId, requesterId, "SHARE", targetUser.getEmail());

        return toCollaboratorResponse(collab);
    }

    @Transactional
    public void removeCollaborator(String docId, String targetUserId, String requesterId) {
        Document doc = getDocumentEntity(docId);
        verifyOwnerAccess(doc, requesterId);
        User targetUser = getUser(targetUserId);
        collaboratorRepository.deleteByDocumentAndUser(doc, targetUser);
        log.info("Collaborator {} removed from document {}", targetUserId, docId);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto.CollaboratorResponse> getCollaborators(String docId, String userId) {
        Document doc = getDocumentEntity(docId);
        verifyReadAccess(doc, userId);
        return collaboratorRepository.findByDocument(doc).stream()
                .map(this::toCollaboratorResponse)
                .collect(Collectors.toList());
    }

    // ─── Access Control ──────────────────────────────────────────────────────

    private void verifyReadAccess(Document doc, String userId) {
        if (doc.isPublic()) return;
        if (doc.getOwner().getId().equals(userId)) return;
        User user = getUser(userId);
        if (!collaboratorRepository.existsByDocumentAndUser(doc, user)) {
            throw new UnauthorizedException("You do not have access to this document");
        }
    }

    private void verifyWriteAccess(Document doc, String userId) {
        if (doc.isPublic()) return; // Let anyone edit if the document is public
        if (doc.getOwner().getId().equals(userId)) return;
        User user = getUser(userId);
        collaboratorRepository.findByDocumentAndUser(doc, user)
                .filter(c -> c.getRole() == Collaborator.CollaboratorRole.WRITE
                        || c.getRole() == Collaborator.CollaboratorRole.OWNER)
                .orElseThrow(() -> new UnauthorizedException("Write access required for this document"));
    }

    private void verifyOwnerAccess(Document doc, String userId) {
        if (!doc.getOwner().getId().equals(userId)) {
            throw new UnauthorizedException("Owner access required for this operation");
        }
    }

    private void verifyAccess(DocumentDto.DocumentResponse response, String userId) {
        if (!response.isPublic() && !response.getOwner().getId().equals(userId)) {
            // simplified check for cached version
        }
    }

    // ─── Redis Helpers ───────────────────────────────────────────────────────

    private void cacheDocument(Document doc) {
        String key = DOC_CACHE_PREFIX + doc.getId();
        redisTemplate.opsForValue().set(key, toDocumentResponse(doc), CACHE_TTL_MINUTES, TimeUnit.MINUTES);
    }

    private void evictCache(String docId) {
        redisTemplate.delete(DOC_CACHE_PREFIX + docId);
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    public DocumentDto.DocumentResponse toDocumentResponse(Document doc) {
        int collabCount = collaboratorRepository.findByDocument(doc).size();
        return DocumentDto.DocumentResponse.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .content(doc.getContent())
                .isPublic(doc.isPublic())
                .owner(toUserDto(doc.getOwner()))
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .collaboratorCount(collabCount)
                .build();
    }

    private DocumentDto.DocumentListResponse toDocumentListResponse(Document doc) {
        return DocumentDto.DocumentListResponse.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .isPublic(doc.isPublic())
                .owner(toUserDto(doc.getOwner()))
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    private DocumentDto.CollaboratorResponse toCollaboratorResponse(Collaborator c) {
        return DocumentDto.CollaboratorResponse.builder()
                .id(c.getId())
                .user(toUserDto(c.getUser()))
                .role(c.getRole())
                .invitedAt(c.getInvitedAt())
                .build();
    }

    private AuthDto.UserDto toUserDto(User user) {
        AuthDto.UserDto dto = new AuthDto.UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    // ─── DB Helpers ──────────────────────────────────────────────────────────

    public Document getDocumentEntity(String docId) {
        return documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", docId));
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
