package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Detailed version response including the full content snapshot for preview/restore.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionDetailResponse {

    private UUID id;
    private Integer versionNumber;
    private String contentSnapshot;
    private UserDto createdBy;
    private LocalDateTime createdAt;
}
