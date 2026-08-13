package com.enterprise.docs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for creating a new document.
 */
@Data
public class CreateDocumentRequest {

    @NotBlank(message = "Document title is required")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;

    private boolean isPublic = false;
}
