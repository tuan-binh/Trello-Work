package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ActivityRes(
        Long id,
        String author,
        String actionText,
        String targetText,
        LocalDateTime createdAt
) {
}
