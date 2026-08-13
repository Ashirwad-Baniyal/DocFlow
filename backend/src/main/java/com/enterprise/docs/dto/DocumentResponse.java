package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Full document detail response including content, owner, and collaborator count.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private UUID id;
    private String title;
    private String content;
    private boolean isPublic;
    private UserDto owner;
    private long collaboratorCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
