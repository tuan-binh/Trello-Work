package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.UnauthorizedException;
import org.example.back_end.models.dto.responses.UserRes;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.repositories.UserRepository;
import org.example.back_end.models.services.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tiếp tục");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy thông tin tài khoản"));
    }

    @Override
    public UserRes getCurrentUserProfile() {
        User user = getCurrentUser();
        return UserRes.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
