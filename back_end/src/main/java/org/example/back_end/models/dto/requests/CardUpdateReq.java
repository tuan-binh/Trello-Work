package org.example.back_end.models.dto.requests;

import java.time.LocalDateTime;

public record CardUpdateReq(
        String title,
        String description,
        LocalDateTime dueDate,
        Boolean isDueComplete,
        String coverUrl,
        String coverColor,
        Boolean isArchived
) {
}
