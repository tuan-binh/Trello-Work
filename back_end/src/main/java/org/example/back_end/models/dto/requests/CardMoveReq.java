package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotNull;

public record CardMoveReq(
        @NotNull(message = "targetListId không được để trống")
        Long targetListId,

        @NotNull(message = "targetPosition không được để trống")
        Double targetPosition
) {
}
