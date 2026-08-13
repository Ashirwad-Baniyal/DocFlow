package com.enterprise.docs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for creating a new inline comment on a document.
 */
@Data
public class CreateCommentRequest {

    @NotBlank(message = "Comment content is required")
    @Size(max = 10000, message = "Comment content cannot exceed 10000 characters")
    private String content;

    @NotNull(message = "Start offset is required")
    private Integer startOffset;

    @NotNull(message = "End offset is required")
    private Integer endOffset;
}
