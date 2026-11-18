package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record AttachmentRes(
        Long id,
        String name,
        String url,
        String size,
        boolean isCover,
        LocalDateTime createdAt
) {
}
