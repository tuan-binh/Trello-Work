package org.example.back_end.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.back_end.models.dto.requests.LoginReq;
import org.example.back_end.models.dto.requests.RegisterReq;
import org.example.back_end.models.dto.responses.JwtRes;
import org.example.back_end.models.services.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "1. Authentication", description = "Đăng ký & Đăng nhập hệ thống")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Tạo tài khoản người dùng mới với email và mật khẩu.")
    public ResponseEntity<?> handleRegister(@Valid @RequestBody RegisterReq req) {
        authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Xác thực tài khoản và trả về JWT Access Token.")
    public ResponseEntity<JwtRes> handleLogin(@Valid @RequestBody LoginReq req) {
        JwtRes jwtRes = authService.login(req);
        return ResponseEntity.ok(jwtRes);
    }
}
