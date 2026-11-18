package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.BoardCreateReq;
import org.example.back_end.models.dto.requests.BoardUpdateReq;
import org.example.back_end.models.dto.requests.ListCreateReq;
import org.example.back_end.models.dto.requests.ListReorderReq;
import org.example.back_end.models.dto.requests.MemberInviteReq;
import org.example.back_end.models.dto.requests.MemberRoleReq;
import org.example.back_end.models.dto.responses.BoardDetailRes;
import org.example.back_end.models.dto.responses.BoardSummaryRes;
import org.example.back_end.models.dto.responses.ListRes;
import org.example.back_end.models.dto.responses.MemberRes;
import org.example.back_end.models.services.BoardService;
import org.example.back_end.models.services.ListService;
import org.springframework.http.HttpStatus;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/boards")
@RequiredArgsConstructor
@Tag(name = "4. Boards", description = "Quản lý Bảng làm việc & Thành viên")
public class BoardController {
    private final BoardService boardService;
    private final ListService listService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Bảng", description = "Hỗ trợ lọc theo workspaceId, search tiêu đề và starred.")
    public ResponseEntity<List<BoardSummaryRes>> getBoards(
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean starred
    ) {
        return ResponseEntity.ok(boardService.getBoards(workspaceId, search, starred));
    }

    @PostMapping
    @Operation(summary = "Tạo Bảng mới", description = "Tạo một bảng làm việc mới kèm bộ nhãn mặc định.")
    public ResponseEntity<BoardSummaryRes> createBoard(@Valid @RequestBody BoardCreateReq req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createBoard(req));
    }

    @GetMapping("/{boardId}")
    @Operation(summary = "Lấy chi tiết toàn bộ Bảng", description = "Trả về thông tin bảng, danh sách cột, thẻ việc, checklist, nhãn và thành viên.")
    public ResponseEntity<BoardDetailRes> getBoardDetail(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.getBoardDetail(boardId));
    }

    @PatchMapping("/{boardId}")
    @Operation(summary = "Cập nhật Bảng", description = "Đổi tiêu đề, gắn sao, đổi ảnh nền hoặc dải màu gradient.")
    public ResponseEntity<BoardSummaryRes> updateBoard(
            @PathVariable Long boardId,
            @RequestBody BoardUpdateReq req
    ) {
        return ResponseEntity.ok(boardService.updateBoard(boardId, req));
    }

    @PostMapping("/{boardId}/members/invite")
    @Operation(summary = "Mời thành viên vào Bảng", description = "Mời một người dùng vào bảng bằng email và phân quyền.")
    public ResponseEntity<MemberRes> inviteMember(
            @PathVariable Long boardId,
            @Valid @RequestBody MemberInviteReq req
    ) {
        return ResponseEntity.ok(boardService.inviteMember(boardId, req));
    }

    @PatchMapping("/{boardId}/members/{memberId}")
    @Operation(summary = "Thay đổi quyền thành viên", description = "Thay đổi vai trò của thành viên trong bảng (ADMIN, MEMBER, OBSERVER).")
    public ResponseEntity<MemberRes> updateMemberRole(
            @PathVariable Long boardId,
            @PathVariable Long memberId,
            @Valid @RequestBody MemberRoleReq req
    ) {
        return ResponseEntity.ok(boardService.updateMemberRole(boardId, memberId, req));
    }

    @DeleteMapping("/{boardId}/members/{memberId}")
    @Operation(summary = "Xóa thành viên khỏi Bảng", description = "Xóa quyền truy cập của thành viên khỏi bảng.")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long boardId,
            @PathVariable Long memberId
    ) {
        boardService.removeMember(boardId, memberId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{boardId}/invite-link")
    @Operation(summary = "Lấy liên kết mời tham gia Bảng", description = "Tạo URL lời mời để chia sẻ cho các thành viên khác.")
    public ResponseEntity<Map<String, String>> getInviteLink(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.getInviteLink(boardId));
    }

    @PostMapping("/{boardId}/lists")
    @Operation(summary = "Tạo Danh sách (Cột) mới trong Bảng", description = "Thêm cột danh sách mới vào cuối bảng.")
    public ResponseEntity<ListRes> createList(
            @PathVariable Long boardId,
            @Valid @RequestBody ListCreateReq req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listService.createList(boardId, req));
    }

    @PatchMapping("/{boardId}/lists/reorder")
    @Operation(summary = "Sắp xếp lại các Danh sách", description = "Cập nhật vị trí kéo thả cho các cột danh sách.")
    public ResponseEntity<Void> reorderLists(
            @PathVariable Long boardId,
            @RequestBody ListReorderReq req
    ) {
        listService.reorderLists(boardId, req);
        return ResponseEntity.ok().build();
    }
}
