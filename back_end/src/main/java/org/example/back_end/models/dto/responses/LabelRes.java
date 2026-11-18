package org.example.back_end.models.dto.responses;

import lombok.Builder;

@Builder
public record LabelRes(
        Long id,
        String name,
        String color
) {
}
