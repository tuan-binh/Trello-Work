package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.responses.UserRes;
import org.example.back_end.models.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "2. Users", description = "Quản lý thông tin người dùng")
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Trả về thông tin chi tiết của người dùng đang đăng nhập dựa trên JWT token.")
    public ResponseEntity<UserRes> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }
}
