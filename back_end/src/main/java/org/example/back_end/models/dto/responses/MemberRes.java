package org.example.back_end.models.dto.responses;

import lombok.Builder;

@Builder
public record MemberRes(
        Long id,
        String name,
        String email,
        String initials,
        String avatarBg,
        String role,
        String status
) {
}
