package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ListCreateReq(
        @NotBlank(message = "Tiêu đề danh sách không được để trống")
        @Size(max = 150, message = "Tiêu đề không được vượt quá 150 ký tự")
        String title,

        Double position
) {
}
