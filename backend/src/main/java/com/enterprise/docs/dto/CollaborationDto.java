package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebSocket message DTOs for real-time collaboration.
 */
public class CollaborationDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentOperation {
        private String operationId;
        private String type;       // INSERT | DELETE | REPLACE
        private int position;
        private String content;
        private int length;
        private String userId;
        private String docId;
        private long timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CursorPosition {
        private String userId;
        private String userFullName;
        private String userColor;
        private int position;
        private String docId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserPresence {
        private String userId;
        private String userFullName;
        private String userColor;
        private String avatarUrl;
        private String docId;
        private String status;     // JOINED | LEFT
    }
}
