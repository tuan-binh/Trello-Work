package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.util.List;

@Builder
public record ListRes(
        Long id,
        String title,
        double position,
        boolean isArchived,
        List<CardSummaryRes> cards
) {
}
