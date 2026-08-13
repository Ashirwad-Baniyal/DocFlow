package com.enterprise.docs.kafka;

import com.enterprise.docs.model.Notification;
import com.enterprise.docs.service.AuditService;
import com.enterprise.docs.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import org.springframework.context.annotation.Profile;

/**
 * Kafka consumers for all three event topics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Profile("!local")
public class KafkaConsumerService {

    private final NotificationService notificationService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "document-events", groupId = "docs-consumer-group")
    public void consumeDocumentEvent(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode node = objectMapper.readTree(record.value());
            String action = node.path("action").asText();
            String docId = node.path("docId").asText();
            String userId = node.path("userId").asText();
            log.info("[document-events] action={} docId={} userId={}", action, docId, userId);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing document event: {}", e.getMessage());
            ack.acknowledge(); // Acknowledge to avoid infinite retries; dead-letter in prod
        }
    }

    @KafkaListener(topics = "notification-events", groupId = "docs-consumer-group")
    public void consumeNotificationEvent(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode node = objectMapper.readTree(record.value());
            String userId = node.path("userId").asText();
            String title = node.path("title").asText();
            String content = node.path("content").asText();
            String type = node.path("type").asText();

            Notification.NotificationType notifType;
            try {
                notifType = Notification.NotificationType.valueOf(type);
            } catch (IllegalArgumentException e) {
                notifType = Notification.NotificationType.DOCUMENT_UPDATE;
            }

            notificationService.createNotification(userId, title, content, notifType);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing notification event: {}", e.getMessage());
            ack.acknowledge();
        }
    }

    @KafkaListener(topics = "audit-events", groupId = "docs-consumer-group")
    public void consumeAuditEvent(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode node = objectMapper.readTree(record.value());
            String userId = node.path("userId").asText();
            String action = node.path("action").asText();
            String details = node.path("details").asText();
            String ip = node.path("ip").asText();

            auditService.log(
                    "anonymous".equals(userId) ? null : userId,
                    action, details, ip);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing audit event: {}", e.getMessage());
            ack.acknowledge();
        }
    }
}
