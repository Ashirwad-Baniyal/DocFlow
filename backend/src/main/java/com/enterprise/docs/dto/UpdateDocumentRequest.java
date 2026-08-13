package com.enterprise.docs.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for updating an existing document's metadata and/or content.
 * All fields are optional — only non-null fields are applied.
 */
@Data
public class UpdateDocumentRequest {

    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;

    /** The full document content (may be very large). */
    private String content;

    private Boolean isPublic;
}
