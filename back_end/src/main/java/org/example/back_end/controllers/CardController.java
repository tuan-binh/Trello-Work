package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.CardMoveReq;
import org.example.back_end.models.dto.requests.CardUpdateReq;
import org.example.back_end.models.dto.requests.ChecklistCreateReq;
import org.example.back_end.models.dto.requests.CommentReq;
import org.example.back_end.models.dto.responses.AttachmentRes;
import org.example.back_end.models.dto.responses.CardActivitiesRes;
import org.example.back_end.models.dto.responses.CardDetailRes;
import org.example.back_end.models.dto.responses.CardSummaryRes;
import org.example.back_end.models.dto.responses.ChecklistRes;
import org.example.back_end.models.dto.responses.CommentRes;
import org.example.back_end.models.services.AttachmentService;
import org.example.back_end.models.services.CardService;
import org.example.back_end.models.services.ChecklistService;
import org.example.back_end.models.services.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
@Tag(name = "6. Cards", description = "Quản lý Thẻ việc (Kanban Cards), Kéo thả, Gán nhãn & Thành viên")
public class CardController {
    private final CardService cardService;
    private final ChecklistService checklistService;
    private final CommentService commentService;
    private final AttachmentService attachmentService;

    @GetMapping("/{cardId}")
    @Operation(summary = "Lấy chi tiết Thẻ việc", description = "Lấy dữ liệu đầy đủ bao gồm mô tả, checklists, file đính kèm, nhãn và hoạt động.")
    public ResponseEntity<CardDetailRes> getCardDetail(@PathVariable Long cardId) {
        return ResponseEntity.ok(cardService.getCardDetail(cardId));
    }

    @PatchMapping("/{cardId}")
    @Operation(summary = "Cập nhật Thẻ việc", description = "Đổi tiêu đề, mô tả Markdown, hạn chót, hoàn thành, ảnh bìa/màu bìa hoặc lưu trữ.")
    public ResponseEntity<CardSummaryRes> updateCard(
            @PathVariable Long cardId,
            @RequestBody CardUpdateReq req
    ) {
        return ResponseEntity.ok(cardService.updateCard(cardId, req));
    }

    @PostMapping("/{cardId}/move")
    @Operation(summary = "Kéo thả / Di chuyển Thẻ việc", description = "Di chuyển thẻ sang cột khác hoặc đổi thứ tự trong cùng một cột.")
    public ResponseEntity<CardSummaryRes> moveCard(
            @PathVariable Long cardId,
            @Valid @RequestBody CardMoveReq req
    ) {
        return ResponseEntity.ok(cardService.moveCard(cardId, req));
    }

    @DeleteMapping("/{cardId}")
    @Operation(summary = "Xóa Thẻ vĩnh viễn", description = "Xóa hoàn toàn thẻ việc khỏi hệ thống.")
    public ResponseEntity<Void> deleteCard(@PathVariable Long cardId) {
        cardService.deleteCard(cardId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{cardId}/members/{userId}")
    @Operation(summary = "Gán thành viên vào Thẻ")
    public ResponseEntity<Void> addMember(
            @PathVariable Long cardId,
            @PathVariable Long userId
    ) {
        cardService.addMemberToCard(cardId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{cardId}/members/{userId}")
    @Operation(summary = "Hủy gán thành viên khỏi Thẻ")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long cardId,
            @PathVariable Long userId
    ) {
        cardService.removeMemberFromCard(cardId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{cardId}/labels/{labelId}")
    @Operation(summary = "Gán nhãn cho Thẻ")
    public ResponseEntity<Void> addLabel(
            @PathVariable Long cardId,
            @PathVariable Long labelId
    ) {
        cardService.addLabelToCard(cardId, labelId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{cardId}/labels/{labelId}")
    @Operation(summary = "Hủy nhãn khỏi Thẻ")
    public ResponseEntity<Void> removeLabel(
            @PathVariable Long cardId,
            @PathVariable Long labelId
    ) {
        cardService.removeLabelFromCard(cardId, labelId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cardId}/activities")
    @Operation(summary = "Lấy lịch sử hoạt động & Bình luận của Thẻ")
    public ResponseEntity<CardActivitiesRes> getActivities(@PathVariable Long cardId) {
        return ResponseEntity.ok(cardService.getCardActivities(cardId));
    }

    @PostMapping("/{cardId}/comments")
    @Operation(summary = "Thêm bình luận vào Thẻ")
    public ResponseEntity<CommentRes> addComment(
            @PathVariable Long cardId,
            @Valid @RequestBody CommentReq req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.addComment(cardId, req));
    }

    @PostMapping("/{cardId}/checklists")
    @Operation(summary = "Thêm Checklist vào Thẻ")
    public ResponseEntity<ChecklistRes> createChecklist(
            @PathVariable Long cardId,
            @Valid @RequestBody ChecklistCreateReq req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(checklistService.createChecklist(cardId, req));
    }

    @PostMapping(value = "/{cardId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tệp đính kèm cho Thẻ (Multipart File)")
    public ResponseEntity<AttachmentRes> uploadAttachment(
            @PathVariable Long cardId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isCover", required = false) Boolean isCover
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attachmentService.uploadAttachment(cardId, file, isCover));
    }
}
