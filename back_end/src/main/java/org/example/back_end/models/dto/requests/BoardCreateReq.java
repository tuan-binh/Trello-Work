package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.back_end.models.constants.BoardVisibility;

public record BoardCreateReq(
        Long workspaceId,

        @NotBlank(message = "Tiêu đề bảng không được để trống")
        @Size(max = 150, message = "Tiêu đề không được vượt quá 150 ký tự")
        String title,

        String bgGradient,
        String bgImage,
        BoardVisibility visibility
) {
}
