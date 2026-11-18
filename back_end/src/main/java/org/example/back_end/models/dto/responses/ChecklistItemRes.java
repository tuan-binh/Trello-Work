package org.example.back_end.models.dto.responses;

import lombok.Builder;

@Builder
public record ChecklistItemRes(
        Long id,
        String text,
        boolean done,
        double position
) {
}
