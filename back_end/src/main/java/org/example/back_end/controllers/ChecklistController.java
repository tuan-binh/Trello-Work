package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.ChecklistItemReq;
import org.example.back_end.models.dto.responses.ChecklistItemRes;
import org.example.back_end.models.services.ChecklistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checklists")
@RequiredArgsConstructor
@Tag(name = "7. Checklists", description = "Quản lý Danh sách kiểm tra công việc")
public class ChecklistController {
    private final ChecklistService checklistService;

    @DeleteMapping("/{checklistId}")
    @Operation(summary = "Xóa Checklist")
    public ResponseEntity<Void> deleteChecklist(@PathVariable Long checklistId) {
        checklistService.deleteChecklist(checklistId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{checklistId}/items")
    @Operation(summary = "Thêm mục kiểm tra vào Checklist")
    public ResponseEntity<ChecklistItemRes> addItem(
            @PathVariable Long checklistId,
            @Valid @RequestBody ChecklistItemReq req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(checklistService.addItem(checklistId, req));
    }
}
