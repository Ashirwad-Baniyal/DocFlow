package com.enterprise.docs.controller;

import com.enterprise.docs.dto.DocumentDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.dto.VersionDto;
import com.enterprise.docs.repository.UserRepository;
import com.enterprise.docs.service.VersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/documents/{docId}/versions")
@RequiredArgsConstructor
@Tag(name = "Version History", description = "Document version history and restore")
public class VersionController {

    private final VersionService versionService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "List version history for a document")
    public ResponseEntity<PagedResponse<VersionDto.VersionResponse>> getVersions(
            @PathVariable String docId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(versionService.getVersions(
                docId, userId, PageRequest.of(page, size, Sort.by("versionNumber").descending())));
    }

    @GetMapping("/{versionId}")
    @Operation(summary = "Get a specific version detail including content snapshot")
    public ResponseEntity<VersionDto.VersionDetailResponse> getVersion(
            @PathVariable String docId,
            @PathVariable String versionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(versionService.getVersion(versionId, resolveUserId(userDetails.getUsername())));
    }

    @PostMapping("/{versionId}/restore")
    @Operation(summary = "Restore document to a previous version")
    public ResponseEntity<DocumentDto.DocumentResponse> restoreVersion(
            @PathVariable String docId,
            @PathVariable String versionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(versionService.restoreVersion(versionId, resolveUserId(userDetails.getUsername())));
    }

    @PostMapping("/snapshot")
    @Operation(summary = "Manually save the current document state as a version snapshot")
    public ResponseEntity<VersionDto.VersionResponse> saveSnapshot(
            @PathVariable String docId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(versionService.saveVersion(docId, resolveUserId(userDetails.getUsername())));
    }

    private String resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
