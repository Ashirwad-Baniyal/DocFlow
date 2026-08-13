package com.enterprise.docs.controller;

import com.enterprise.docs.dto.CommentDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.repository.UserRepository;
import com.enterprise.docs.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/documents/{docId}/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Document comments and threaded replies")
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Add a comment to a document")
    public ResponseEntity<CommentDto.CommentResponse> addComment(
            @PathVariable String docId,
            @Valid @RequestBody CommentDto.CreateCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(docId, request, userId));
    }

    @GetMapping
    @Operation(summary = "List comments for a document")
    public ResponseEntity<PagedResponse<CommentDto.CommentResponse>> getComments(
            @PathVariable String docId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(commentService.getComments(
                docId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PutMapping("/{commentId}/resolve")
    @Operation(summary = "Resolve a comment discussion")
    public ResponseEntity<CommentDto.CommentResponse> resolveComment(
            @PathVariable String docId,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.resolveComment(commentId, resolveUserId(userDetails.getUsername())));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String docId,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(commentId, resolveUserId(userDetails.getUsername()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{commentId}/replies")
    @Operation(summary = "Add a reply to a comment")
    public ResponseEntity<CommentDto.ReplyResponse> addReply(
            @PathVariable String docId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentDto.CreateReplyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addReply(commentId, request, userId));
    }

    private String resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
