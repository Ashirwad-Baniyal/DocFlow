package com.enterprise.docs.service;

import com.enterprise.docs.dto.AuthDto;
import com.enterprise.docs.dto.CommentDto;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Comment and reply management with notification publishing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final ReplyRepository replyRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final KafkaProducerService kafkaProducer;

    @Transactional
    public CommentDto.CommentResponse addComment(String docId, CommentDto.CreateCommentRequest req, String userId) {
        Document doc = getDocument(docId);
        User user = getUser(userId);

        Comment comment = Comment.builder()
                .document(doc)
                .user(user)
                .content(req.getContent())
                .startOffset(req.getStartOffset())
                .endOffset(req.getEndOffset())
                .resolved(false)
                .build();
        commentRepository.save(comment);

        // Notify document owner if commenter is not the owner
        if (!doc.getOwner().getId().equals(userId)) {
            notificationService.createNotification(
                    doc.getOwner().getId(),
                    "New Comment",
                    user.getFullName() + " commented on: " + doc.getTitle(),
                    Notification.NotificationType.COMMENT
            );
        }

        kafkaProducer.publishNotificationEvent(
                doc.getOwner().getId(), "New Comment",
                user.getFullName() + " added a comment", "COMMENT");

        log.info("Comment added to document: {}", docId);
        return toCommentResponse(comment);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommentDto.CommentResponse> getComments(String docId, Pageable pageable) {
        Document doc = getDocument(docId);
        Page<Comment> comments = commentRepository.findByDocument(doc, pageable);
        return PagedResponse.of(comments.map(this::toCommentResponse));
    }

    @Transactional
    public CommentDto.CommentResponse resolveComment(String commentId, String userId) {
        Comment comment = getComment(commentId);
        Document doc = comment.getDocument();

        if (!comment.getUser().getId().equals(userId) && !doc.getOwner().getId().equals(userId)) {
            throw new UnauthorizedException("Only the comment author or document owner can resolve comments");
        }

        comment.setResolved(true);
        commentRepository.save(comment);
        log.info("Comment {} resolved by user {}", commentId, userId);
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(String commentId, String userId) {
        Comment comment = getComment(commentId);
        if (!comment.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Only the comment author can delete this comment");
        }
        commentRepository.delete(comment);
    }

    @Transactional
    public CommentDto.ReplyResponse addReply(String commentId, CommentDto.CreateReplyRequest req, String userId) {
        Comment comment = getComment(commentId);
        User user = getUser(userId);

        Reply reply = Reply.builder()
                .comment(comment)
                .user(user)
                .content(req.getContent())
                .build();
        replyRepository.save(reply);

        // Notify original commenter
        if (!comment.getUser().getId().equals(userId)) {
            notificationService.createNotification(
                    comment.getUser().getId(),
                    "Reply to your comment",
                    user.getFullName() + " replied: " + req.getContent(),
                    Notification.NotificationType.COMMENT
            );
        }

        return toReplyResponse(reply);
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private CommentDto.CommentResponse toCommentResponse(Comment c) {
        List<CommentDto.ReplyResponse> replies = c.getReplies().stream()
                .map(this::toReplyResponse)
                .collect(Collectors.toList());

        return CommentDto.CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .startOffset(c.getStartOffset())
                .endOffset(c.getEndOffset())
                .resolved(c.isResolved())
                .user(toUserDto(c.getUser()))
                .replies(replies)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private CommentDto.ReplyResponse toReplyResponse(Reply r) {
        return CommentDto.ReplyResponse.builder()
                .id(r.getId())
                .content(r.getContent())
                .user(toUserDto(r.getUser()))
                .createdAt(r.getCreatedAt())
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

    private Comment getComment(String commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));
    }
}
