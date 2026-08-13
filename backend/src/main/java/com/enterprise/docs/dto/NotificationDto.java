package com.enterprise.docs.dto;

import com.enterprise.docs.model.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class NotificationDto {

    @Data
    @Builder
    public static class NotificationResponse {
        private String id;
        private String title;
        private String content;
        private boolean isRead;
        private Notification.NotificationType type;
        private LocalDateTime createdAt;
    }
}
