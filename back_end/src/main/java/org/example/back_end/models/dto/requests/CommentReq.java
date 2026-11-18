package org.example.back_end.models.dto.requests;

import jakarta.validation.constraints.NotBlank;

public record CommentReq(
        @NotBlank(message = "Nội dung bình luận không được để trống")
        String text
) {
}
