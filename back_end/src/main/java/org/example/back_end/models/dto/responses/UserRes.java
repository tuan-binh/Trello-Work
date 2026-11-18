package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record UserRes(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        String status,
        LocalDateTime createdAt
) {
}
