package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CardSummaryRes(
        Long id,
        String title,
        String description,
        double position,
        List<LabelRes> labels,
        Integer checklistTotal,
        Integer checklistDone,
        Integer commentsCount,
        LocalDateTime dueDate,
        boolean isDueComplete,
        List<String> members,
        String coverUrl,
        String coverColor,
        boolean isArchived
) {
}
