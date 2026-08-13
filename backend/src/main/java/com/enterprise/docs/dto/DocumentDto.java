package com.enterprise.docs.dto;

import com.enterprise.docs.model.Collaborator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class DocumentDto {

    @Data
    public static class CreateDocumentRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @JsonProperty("isPublic")
        private boolean isPublic = false;
    }

    @Data
    public static class UpdateDocumentRequest {
        private String title;
        private String content;

        @JsonProperty("isPublic")
        private Boolean isPublic;
    }

    @Data
    @Builder
    public static class DocumentResponse {
        private String id;
        private String title;
        private String content;

        @JsonProperty("isPublic")
        private boolean isPublic;
        private AuthDto.UserDto owner;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private int collaboratorCount;
    }

    @Data
    @Builder
    public static class DocumentListResponse {
        private String id;
        private String title;

        @JsonProperty("isPublic")
        private boolean isPublic;
        private AuthDto.UserDto owner;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class ShareDocumentRequest {
        @NotNull(message = "User ID is required")
        private String userId;

        @NotNull(message = "Role is required")
        private Collaborator.CollaboratorRole role;
    }

    @Data
    @Builder
    public static class CollaboratorResponse {
        private String id;
        private AuthDto.UserDto user;
        private Collaborator.CollaboratorRole role;
        private LocalDateTime invitedAt;
    }
}
