package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.example.back_end.models.constants.RoleName;

public record MemberInviteReq(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        RoleName role
) {
}
