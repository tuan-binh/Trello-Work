package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record CommentRes(
        Long id,
        String author,
        String initials,
        String avatarBg,
        String text,
        LocalDateTime createdAt
) {
}
