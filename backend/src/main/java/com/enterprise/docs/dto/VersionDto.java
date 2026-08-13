package com.enterprise.docs.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class VersionDto {

    @Data
    @Builder
    public static class VersionResponse {
        private String id;
        private Integer versionNumber;
        private AuthDto.UserDto createdBy;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class VersionDetailResponse {
        private String id;
        private Integer versionNumber;
        private String contentSnapshot;
        private AuthDto.UserDto createdBy;
        private LocalDateTime createdAt;
    }
}
