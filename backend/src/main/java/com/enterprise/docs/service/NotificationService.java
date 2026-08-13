package com.enterprise.docs.service;

import com.enterprise.docs.dto.NotificationDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.exception.ResourceNotFoundException;
import com.enterprise.docs.model.Notification;
import com.enterprise.docs.model.User;
import com.enterprise.docs.repository.NotificationRepository;
import com.enterprise.docs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createNotification(String userId, String title, String content, Notification.NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // Push in real-time via WebSocket
        NotificationDto.NotificationResponse response = toResponse(notification);
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", response);
        log.debug("Notification created for user {}: {}", userId, title);
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDto.NotificationResponse> getUserNotifications(String userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Page<Notification> page = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return PagedResponse.of(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification", "id", notificationId);
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        notificationRepository.markAllAsReadForUser(user);
    }

    private NotificationDto.NotificationResponse toResponse(Notification n) {
        return NotificationDto.NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .isRead(n.isRead())
                .type(n.getType())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
