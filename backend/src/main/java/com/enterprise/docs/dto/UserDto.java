package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

/**
 * Lightweight user representation returned in auth responses and embedded in
 * document/comment responses to avoid exposing sensitive fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Set<String> roles;
}
