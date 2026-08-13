package com.enterprise.docs.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * Kafka event producer. Publishes JSON-serialised events to document-events,
 * notification-events, and audit-events topics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishDocumentEvent(String docId, String userId, String action, String payload) {
        publish("document-events", docId, Map.of(
                "docId", docId,
                "userId", userId,
                "action", action,
                "payload", payload != null ? payload : "",
                "timestamp", Instant.now().toString()
        ));
    }

    public void publishNotificationEvent(String userId, String title, String content, String type) {
        publish("notification-events", userId, Map.of(
                "userId", userId,
                "title", title,
                "content", content,
                "type", type,
                "timestamp", Instant.now().toString()
        ));
    }

    public void publishAuditEvent(String userId, String action, String details, String ip) {
        publish("audit-events", userId != null ? userId : "anonymous", Map.of(
                "userId", userId != null ? userId : "anonymous",
                "action", action,
                "details", details != null ? details : "",
                "ip", ip != null ? ip : "unknown",
                "timestamp", Instant.now().toString()
        ));
    }

    private void publish(String topic, String key, Map<String, String> payload) {
        try {
            String message = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, key, message)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish to topic {}: {}", topic, ex.getMessage());
                        } else {
                            log.debug("Published to topic {} partition {}", topic,
                                    result.getRecordMetadata().partition());
                        }
                    });
        } catch (Exception e) {
            log.error("Error serialising Kafka event: {}", e.getMessage());
        }
    }
}
