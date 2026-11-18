package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.util.List;

@Builder
public record ChecklistRes(
        Long id,
        String title,
        double position,
        List<ChecklistItemRes> items
) {
}
