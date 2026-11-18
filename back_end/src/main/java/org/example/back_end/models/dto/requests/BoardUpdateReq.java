package org.example.back_end.models.dto.requests;

import org.example.back_end.models.constants.BoardVisibility;

public record BoardUpdateReq(
        String title,
        Boolean starred,
        String bgGradient,
        String bgImage,
        BoardVisibility visibility
) {
}
