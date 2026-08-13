package com.enterprise.docs.controller;

import com.enterprise.docs.dto.DocumentDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.service.DocumentService;
import com.enterprise.docs.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Document CRUD, sharing and search")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Create a new document")
    public ResponseEntity<DocumentDto.DocumentResponse> create(
            @Valid @RequestBody DocumentDto.CreateDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.createDocument(request, userId));
    }

    @GetMapping
    @Operation(summary = "List documents accessible by current user")
    public ResponseEntity<PagedResponse<DocumentDto.DocumentListResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return ResponseEntity.ok(documentService.getUserDocuments(resolveUserId(userDetails), pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Search documents by title")
    public ResponseEntity<PagedResponse<DocumentDto.DocumentListResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return ResponseEntity.ok(documentService.searchDocuments(q, resolveUserId(userDetails), pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a document by ID")
    public ResponseEntity<DocumentDto.DocumentResponse> getById(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails != null ? resolveUserId(userDetails) : null;
        return ResponseEntity.ok(documentService.getDocument(id, userId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a document's title, content or visibility")
    public ResponseEntity<DocumentDto.DocumentResponse> update(
            @PathVariable String id,
            @RequestBody DocumentDto.UpdateDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.updateDocument(id, request, resolveUserId(userDetails)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document (owner only)")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.deleteDocument(id, resolveUserId(userDetails));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    @Operation(summary = "Share document with another user")
    public ResponseEntity<DocumentDto.CollaboratorResponse> share(
            @PathVariable String id,
            @Valid @RequestBody DocumentDto.ShareDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.shareDocument(id, request, resolveUserId(userDetails)));
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    @Operation(summary = "Remove a collaborator from a document")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable String id,
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.removeCollaborator(id, userId, resolveUserId(userDetails));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/collaborators")
    @Operation(summary = "List all collaborators of a document")
    public ResponseEntity<List<DocumentDto.CollaboratorResponse>> getCollaborators(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.getCollaborators(id, resolveUserId(userDetails)));
    }

    /**
     * Resolves the authenticated user's UUID from their email (Spring Security username).
     * JwtAuthenticationFilter sets the principal username to the user's email.
     */
    private String resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .map(u -> u.getId())
                .orElseThrow(() -> new com.enterprise.docs.exception.ResourceNotFoundException(
                        "User", "email", userDetails.getUsername()));
    }
}
