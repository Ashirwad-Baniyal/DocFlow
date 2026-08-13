package com.enterprise.docs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Reply response including author details and creation timestamp.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyResponse {

    private UUID id;
    private String content;
    private UserDto user;
    private LocalDateTime createdAt;
}
