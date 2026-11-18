package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.responses.AttachmentRes;
import org.example.back_end.models.services.AttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
@Tag(name = "10. Attachments", description = "Quản lý Tệp đính kèm & Ảnh bìa")
public class AttachmentController {
    private final AttachmentService attachmentService;

    @PatchMapping("/{attachmentId}/cover")
    @Operation(summary = "Đặt hoặc hủy ảnh bìa thẻ bằng tệp đính kèm")
    public ResponseEntity<AttachmentRes> toggleCover(
            @PathVariable Long attachmentId,
            @RequestBody Map<String, Boolean> body
    ) {
        Boolean isCover = body.getOrDefault("isCover", false);
        return ResponseEntity.ok(attachmentService.toggleCover(attachmentId, isCover));
    }

    @DeleteMapping("/{attachmentId}")
    @Operation(summary = "Xóa tệp đính kèm")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
