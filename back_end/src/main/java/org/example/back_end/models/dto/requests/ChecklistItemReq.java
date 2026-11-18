package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChecklistItemReq(
        @NotBlank(message = "Nội dung không được để trống")
        @Size(max = 255, message = "Nội dung không được vượt quá 255 ký tự")
        String text
) {
}
