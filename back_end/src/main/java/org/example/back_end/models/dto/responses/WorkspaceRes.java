package org.example.back_end.models.dto.responses;

import lombok.Builder;

@Builder
public record WorkspaceRes(
        Long id,
        String name,
        String slug,
        String description,
        String currentUserRole
) {
}
