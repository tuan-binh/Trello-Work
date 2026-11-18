package org.example.back_end.models.dto.requests;

public record ListUpdateReq(
        String title,
        Boolean isArchived
) {
}
