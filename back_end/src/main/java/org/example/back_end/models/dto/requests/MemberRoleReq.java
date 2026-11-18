package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotNull;
import org.example.back_end.models.constants.RoleName;

public record MemberRoleReq(
        @NotNull(message = "Role không được để trống")
        RoleName role
) {
}
