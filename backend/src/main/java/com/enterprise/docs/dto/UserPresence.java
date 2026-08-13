package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Carries user presence information (join/leave) for real-time active-users
 * display in the document editor UI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPresence {

    private UUID userId;
    private String userFullName;

    /**
     * Hex color assigned to this user, e.g. {@code "#2ECC71"}.
     */
    private String userColor;

    private String avatarUrl;
    private UUID docId;

    /** Whether this event is a user joining or leaving the document session. */
    private PresenceStatus status;

    /**
     * Presence event type.
     */
    public enum PresenceStatus {
        JOINED,
        LEFT
    }
}
