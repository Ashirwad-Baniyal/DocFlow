package com.enterprise.docs.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for JWT refresh token exchange.
 */
@Data
public class TokenRefreshRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
