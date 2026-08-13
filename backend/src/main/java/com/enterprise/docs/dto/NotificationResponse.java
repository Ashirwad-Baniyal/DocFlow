package com.enterprise.docs.dto;

import com.enterprise.docs.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Notification response for the notification inbox and WebSocket push messages.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;
    private String title;
    private String content;
    private boolean isRead;
    private NotificationType type;
    private LocalDateTime createdAt;
}
