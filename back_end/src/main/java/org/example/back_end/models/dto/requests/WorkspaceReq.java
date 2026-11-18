package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WorkspaceReq(
        @NotBlank(message = "Tên không gian làm việc không được để trống")
        @Size(max = 120, message = "Tên không được vượt quá 120 ký tự")
        String name,

        String description
) {
}
