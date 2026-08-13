package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Carries the real-time cursor position of a collaborator for broadcast via WebSocket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorPosition {

    /** The user whose cursor moved. */
    private UUID userId;

    /** Display name of the user (for UI overlay label). */
    private String userFullName;

    /**
     * Hex color assigned to this user's cursor, e.g. {@code "#FF5733"}.
     * Colors are deterministically assigned from the user ID on the server.
     */
    private String userColor;

    /** Character offset position within the document content string. */
    private int position;

    /** The document being edited. */
    private UUID docId;
}
