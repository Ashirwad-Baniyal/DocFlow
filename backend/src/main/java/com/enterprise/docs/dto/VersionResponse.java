package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Summary of a document version (no content snapshot) for version list views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionResponse {

    private UUID id;
    private Integer versionNumber;
    private UserDto createdBy;
    private LocalDateTime createdAt;
}
