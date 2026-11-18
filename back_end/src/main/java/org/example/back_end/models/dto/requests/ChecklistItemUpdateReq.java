package org.example.back_end.models.dto.requests;

public record ChecklistItemUpdateReq(
        String text,
        Boolean done
) {
}
