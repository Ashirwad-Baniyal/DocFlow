package com.enterprise.docs.model;

/**
 * Enumeration of notification event types used to categorize system notifications.
 */
public enum NotificationType {
    /**
     * A document has been shared with the user.
     */
    SHARE,
    /**
     * A new comment was added to a document the user is part of.
     */
    COMMENT,
    /**
     * The user was @mentioned in a comment.
     */
    MENTION,
    /**
     * A document the user collaborates on has been updated.
     */
    DOCUMENT_UPDATE
}
