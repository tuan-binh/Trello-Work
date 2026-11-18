package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.LabelCreateReq;
import org.example.back_end.models.dto.responses.LabelRes;
import org.example.back_end.models.services.LabelService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/boards/{boardId}/labels")
@RequiredArgsConstructor
@Tag(name = "9. Labels", description = "Quản lý Nhãn dán công việc")
public class LabelController {
    private final LabelService labelService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Nhãn dán của Bảng")
    public ResponseEntity<List<LabelRes>> getLabels(@PathVariable Long boardId) {
        return ResponseEntity.ok(labelService.getBoardLabels(boardId));
    }

    @PostMapping
    @Operation(summary = "Tạo Nhãn dán mới cho Bảng")
    public ResponseEntity<LabelRes> createLabel(
            @PathVariable Long boardId,
            @Valid @RequestBody LabelCreateReq req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labelService.createLabel(boardId, req));
    }
}
