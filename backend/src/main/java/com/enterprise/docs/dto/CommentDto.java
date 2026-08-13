package com.enterprise.docs.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class CommentDto {

    @Data
    public static class CreateCommentRequest {
        @NotBlank(message = "Content is required")
        private String content;
        private Integer startOffset = 0;
        private Integer endOffset = 0;
    }

    @Data
    public static class CreateReplyRequest {
        @NotBlank(message = "Reply content is required")
        private String content;
    }

    @Data
    @Builder
    public static class CommentResponse {
        private String id;
        private String content;
        private Integer startOffset;
        private Integer endOffset;
        private boolean resolved;
        private AuthDto.UserDto user;
        private List<ReplyResponse> replies;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    public static class ReplyResponse {
        private String id;
        private String content;
        private AuthDto.UserDto user;
        private LocalDateTime createdAt;
    }
}
