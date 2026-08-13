package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a real-time document editing operation transmitted over WebSocket (STOMP).
 * <p>
 * Operations implement a simplified Logoot-inspired CRDT: each position is
 * a fractional index combined with a site ID for total ordering.
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentOperation {

    /** Unique identifier for this operation (used for deduplication). */
    private String operationId;

    /** The type of operation. */
    private OperationType type;

    /** Fractional character position in the logical document sequence. */
    private double position;

    /** The character or string being inserted (for INSERT/REPLACE operations). */
    private String content;

    /** Number of characters to delete or replace (for DELETE/REPLACE operations). */
    private int length;

    /** ID of the user who originated this operation. */
    private UUID userId;

    /** ID of the document being edited. */
    private UUID docId;

    /** UTC timestamp when this operation was generated on the client. */
    private long timestamp;

    /**
     * Operation types for the simplified Logoot CRDT.
     */
    public enum OperationType {
        /** Insert content at a fractional position. */
        INSERT,
        /** Mark characters as deleted (tombstoned) starting at position. */
        DELETE,
        /** Replace content at position (conceptual INSERT + DELETE). */
        REPLACE
    }
}
