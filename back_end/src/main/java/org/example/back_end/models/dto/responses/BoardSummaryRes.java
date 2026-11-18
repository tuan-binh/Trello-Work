package org.example.back_end.models.dto.responses;

import lombok.Builder;
import org.example.back_end.models.constants.BoardVisibility;

@Builder
public record BoardSummaryRes(
        Long id,
        String title,
        Long workspaceId,
        String workspaceName,
        String bgGradient,
        String bgImage,
        boolean starred,
        BoardVisibility visibility,
        String recentViewed
) {
}
