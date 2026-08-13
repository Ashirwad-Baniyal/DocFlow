package com.enterprise.docs.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kafka event payload for document CRUD and content change events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentEvent {

    private String docId;
    private String userId;
    private String action;
    private String payload;
    private long timestamp;
}
