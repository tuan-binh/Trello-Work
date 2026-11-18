package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LabelCreateReq(
        @NotBlank(message = "Tên nhãn không được để trống")
        @Size(max = 50, message = "Tên không được vượt quá 50 ký tự")
        String name,

        @NotBlank(message = "Màu sắc không được để trống")
        @Size(max = 50, message = "Màu không được vượt quá 50 ký tự")
        String color
) {
}
