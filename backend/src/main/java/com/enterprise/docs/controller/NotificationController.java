package com.enterprise.docs.controller;

import com.enterprise.docs.dto.NotificationDto;
import com.enterprise.docs.dto.PagedResponse;
import com.enterprise.docs.repository.UserRepository;
import com.enterprise.docs.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification management")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get paginated notifications for current user")
    public ResponseEntity<PagedResponse<NotificationDto.NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(notificationService.getUserNotifications(
                userId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.getUnreadCount(resolveUserId(userDetails.getUsername()));
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAsRead(id, resolveUserId(userDetails.getUsername()));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(resolveUserId(userDetails.getUsername()));
        return ResponseEntity.noContent().build();
    }

    private String resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
