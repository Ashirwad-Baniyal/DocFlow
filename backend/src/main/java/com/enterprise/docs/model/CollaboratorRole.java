package com.enterprise.docs.model;

/**
 * Enumeration of collaborator permission levels on a document.
 */
public enum CollaboratorRole {
    /**
     * Read-only access: can view the document but cannot edit.
     */
    READ,
    /**
     * Write access: can view and edit the document content and comments.
     */
    WRITE,
    /**
     * Owner access: full control including sharing, deleting and revoking access.
     */
    OWNER
}
