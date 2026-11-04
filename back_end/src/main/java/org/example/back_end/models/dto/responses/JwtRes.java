package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.util.List;

@Builder
public record JwtRes(
        String accessToken,
        String tokenType,
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        List<String> roles
) {
    public JwtRes {
        if (tokenType == null) {
            tokenType = "Bearer";
        }
    }
}
