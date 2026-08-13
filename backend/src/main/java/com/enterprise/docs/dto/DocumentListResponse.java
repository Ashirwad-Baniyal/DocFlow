package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lightweight document summary for list views — excludes the full content body
 * to keep list responses fast and small.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentListResponse {

    private UUID id;
    private String title;
    private boolean isPublic;
    private UserDto owner;
    private long collaboratorCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
