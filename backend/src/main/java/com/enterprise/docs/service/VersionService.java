package com.enterprise.docs.service;

import com.enterprise.docs.dto.AuthDto;
import com.enterprise.docs.dto.DocumentDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.dto.VersionDto;
import com.enterprise.docs.exception.ResourceNotFoundException;
import com.enterprise.docs.model.Document;
import com.enterprise.docs.model.DocumentVersion;
import com.enterprise.docs.model.User;
import com.enterprise.docs.repository.DocumentRepository;
import com.enterprise.docs.repository.DocumentVersionRepository;
import com.enterprise.docs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class VersionService {

    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentService documentService;

    @Transactional
    public VersionDto.VersionResponse saveVersion(String docId, String userId) {
        Document doc = getDocument(docId);
        User user = getUser(userId);
        int nextVersion = versionRepository.findMaxVersionByDocument(doc) + 1;

        DocumentVersion version = DocumentVersion.builder()
                .document(doc)
                .contentSnapshot(doc.getContent())
                .versionNumber(nextVersion)
                .createdBy(user)
                .build();
        versionRepository.save(version);
        log.info("Version {} saved for document {} by user {}", nextVersion, docId, userId);
        return toVersionResponse(version);
    }

    @Transactional(readOnly = true)
    public PagedResponse<VersionDto.VersionResponse> getVersions(String docId, String userId, Pageable pageable) {
        Document doc = getDocument(docId);
        Page<DocumentVersion> versions = versionRepository.findByDocumentOrderByVersionNumberDesc(doc, pageable);
        return PagedResponse.of(versions.map(this::toVersionResponse));
    }

    @Transactional(readOnly = true)
    public VersionDto.VersionDetailResponse getVersion(String versionId, String userId) {
        DocumentVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version", "id", versionId));
        return toVersionDetailResponse(version);
    }

    @Transactional
    public DocumentDto.DocumentResponse restoreVersion(String versionId, String userId) {
        DocumentVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version", "id", versionId));
        Document doc = version.getDocument();

        // Save current state as a new version before restoring
        saveVersion(doc.getId(), userId);

        doc.setContent(version.getContentSnapshot());
        documentRepository.save(doc);
        log.info("Document {} restored to version {} by user {}", doc.getId(), version.getVersionNumber(), userId);
        return documentService.toDocumentResponse(doc);
    }

    private VersionDto.VersionResponse toVersionResponse(DocumentVersion v) {
        return VersionDto.VersionResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .createdBy(v.getCreatedBy() != null ? toUserDto(v.getCreatedBy()) : null)
                .createdAt(v.getCreatedAt())
                .build();
    }

    private VersionDto.VersionDetailResponse toVersionDetailResponse(DocumentVersion v) {
        return VersionDto.VersionDetailResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .contentSnapshot(v.getContentSnapshot())
                .createdBy(v.getCreatedBy() != null ? toUserDto(v.getCreatedBy()) : null)
                .createdAt(v.getCreatedAt())
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

    private Document getDocument(String docId) {
        return documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", docId));
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
