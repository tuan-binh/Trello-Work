package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CardCreateReq(
        @NotBlank(message = "Tiêu đề thẻ không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        Double position
) {
}
