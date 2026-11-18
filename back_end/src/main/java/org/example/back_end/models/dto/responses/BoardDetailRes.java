package org.example.back_end.models.dto.responses;

import lombok.Builder;
import org.example.back_end.models.constants.BoardVisibility;

import java.util.List;

@Builder
public record BoardDetailRes(
        Long id,
        String title,
        String workspace,
        Long workspaceId,
        String bgGradient,
        String bgImage,
        boolean starred,
        BoardVisibility visibility,
        List<MemberRes> members,
        List<LabelRes> labels,
        List<ListRes> lists
) {
}
