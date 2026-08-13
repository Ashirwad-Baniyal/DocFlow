package com.enterprise.docs.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kafka event payload for compliance audit trail events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEvent {

    private String userId;
    private String action;
    private String details;
    private String ipAddress;
    private long timestamp;
}
