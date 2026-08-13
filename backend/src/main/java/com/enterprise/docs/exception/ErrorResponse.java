package com.enterprise.docs.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response body returned by all exception handlers.
 * Provides consistent structure across all API errors for client parsing.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    /** ISO-8601 timestamp of when the error occurred. */
    private LocalDateTime timestamp;

    /** HTTP status code (e.g., 404, 400). */
    private int status;

    /** Short error label (e.g., "Not Found", "Bad Request"). */
    private String error;

    /** Human-readable description of the problem. */
    private String message;

    /** The request URI that caused the error. */
    private String path;

    /**
     * Optional map of field-level validation errors.
     * Populated for 400 validation failures; null otherwise.
     */
    private Map<String, String> validationErrors;
}
