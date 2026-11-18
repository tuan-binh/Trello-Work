package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.CardCreateReq;
import org.example.back_end.models.dto.requests.ListUpdateReq;
import org.example.back_end.models.dto.responses.CardSummaryRes;
import org.example.back_end.models.dto.responses.ListRes;
import org.example.back_end.models.services.CardService;
import org.example.back_end.models.services.ListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/lists")
@RequiredArgsConstructor
@Tag(name = "5. Lists", description = "Quản lý Cột danh sách & Sắp xếp thẻ")
public class ListController {
    private final ListService listService;
    private final CardService cardService;

    @PatchMapping("/{listId}")
    @Operation(summary = "Cập nhật Danh sách", description = "Đổi tên cột danh sách hoặc Lưu trữ / Khôi phục (Archive/Restore).")
    public ResponseEntity<ListRes> updateList(
            @PathVariable Long listId,
            @RequestBody ListUpdateReq req
    ) {
        return ResponseEntity.ok(listService.updateList(listId, req));
    }

    @PostMapping("/{listId}/sort")
    @Operation(summary = "Sắp xếp thẻ trong danh sách", description = "Tự động sắp xếp thẻ theo A-Z (TITLE_ASC) hoặc ngày hết hạn (DUE_DATE_ASC).")
    public ResponseEntity<ListRes> sortList(
            @PathVariable Long listId,
            @RequestBody Map<String, String> body
    ) {
        String sortBy = body.getOrDefault("sortBy", "TITLE_ASC");
        return ResponseEntity.ok(listService.sortList(listId, sortBy));
    }

    @PostMapping("/{listId}/cards")
    @Operation(summary = "Tạo Thẻ mới trong Danh sách", description = "Tạo một thẻ việc mới trong cột danh sách tương ứng.")
    public ResponseEntity<CardSummaryRes> createCard(
            @PathVariable Long listId,
            @Valid @RequestBody CardCreateReq req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cardService.createCard(listId, req));
    }
}
