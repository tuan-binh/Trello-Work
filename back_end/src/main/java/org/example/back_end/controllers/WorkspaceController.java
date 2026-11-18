package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.WorkspaceReq;
import org.example.back_end.models.dto.responses.WorkspaceRes;
import org.example.back_end.models.services.WorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
@Tag(name = "3. Workspaces", description = "Quản lý Không gian làm việc")
public class WorkspaceController {
    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Workspace của tôi", description = "Trả về tất cả không gian làm việc mà user sở hữu hoặc là thành viên.")
    public ResponseEntity<List<WorkspaceRes>> getMyWorkspaces() {
        return ResponseEntity.ok(workspaceService.getAllMyWorkspaces());
    }

    @PostMapping
    @Operation(summary = "Tạo Workspace mới", description = "Tạo một không gian làm việc mới và gán quyền ADMIN cho người tạo.")
    public ResponseEntity<WorkspaceRes> createWorkspace(@Valid @RequestBody WorkspaceReq req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.createWorkspace(req));
    }
}
