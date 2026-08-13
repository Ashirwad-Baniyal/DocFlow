package com.enterprise.docs.dto;

import com.enterprise.docs.model.CollaboratorRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Request body for sharing a document with another user.
 */
@Data
public class ShareDocumentRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Collaborator role is required")
    private CollaboratorRole role;
}
