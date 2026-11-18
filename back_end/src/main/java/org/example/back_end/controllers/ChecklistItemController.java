package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.ChecklistItemUpdateReq;
import org.example.back_end.models.dto.responses.ChecklistItemRes;
import org.example.back_end.models.services.ChecklistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checklist-items")
@RequiredArgsConstructor
@Tag(name = "8. Checklist Items", description = "Đánh dấu hoàn thành / Chỉnh sửa mục Checklist")
public class ChecklistItemController {
    private final ChecklistService checklistService;

    @PatchMapping("/{itemId}")
    @Operation(summary = "Đánh dấu hoàn thành hoặc đổi nội dung mục kiểm tra")
    public ResponseEntity<ChecklistItemRes> updateItem(
            @PathVariable Long itemId,
            @RequestBody ChecklistItemUpdateReq req
    ) {
        return ResponseEntity.ok(checklistService.updateItem(itemId, req));
    }

    @DeleteMapping("/{itemId}")
    @Operation(summary = "Xóa mục kiểm tra")
    public ResponseEntity<Void> deleteItem(@PathVariable Long itemId) {
        checklistService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
