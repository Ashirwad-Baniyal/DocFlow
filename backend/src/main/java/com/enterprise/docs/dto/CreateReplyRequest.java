package com.enterprise.docs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for posting a reply to an existing comment.
 */
@Data
public class CreateReplyRequest {

    @NotBlank(message = "Reply content is required")
    @Size(max = 5000, message = "Reply content cannot exceed 5000 characters")
    private String content;
}
