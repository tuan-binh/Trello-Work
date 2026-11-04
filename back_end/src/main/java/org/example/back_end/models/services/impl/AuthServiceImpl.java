package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.BadRequestException;
import org.example.back_end.exceptions.ConflictException;
import org.example.back_end.models.constants.RoleName;
import org.example.back_end.models.constants.RoleScope;
import org.example.back_end.models.constants.UserStatus;
import org.example.back_end.models.dto.requests.LoginReq;
import org.example.back_end.models.dto.requests.RegisterReq;
import org.example.back_end.models.dto.responses.JwtRes;
import org.example.back_end.models.entities.Role;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.repositories.RoleRepository;
import org.example.back_end.models.repositories.UserRepository;
import org.example.back_end.models.services.AuthService;
import org.example.back_end.security.jwt.JwtUtils;
import org.example.back_end.security.principle.MyUserDetails;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Override
    public void register(RegisterReq req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already exists: " + req.email());
        }

        Role defaultRole = roleRepository.findByName(RoleName.ROLE_SYSTEM_USER)
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setName(RoleName.ROLE_SYSTEM_USER);
                    newRole.setDescription("Default system user role");
                    newRole.setScope(RoleScope.SYSTEM);
                    return roleRepository.save(newRole);
                });

        User user = new User();
        user.setEmail(req.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setFullName(req.fullName().trim());
        user.setAvatarUrl(req.avatarUrl());
        user.setStatus(UserStatus.ACTIVE);
        user.getSystemRoles().add(defaultRole);

        userRepository.save(user);
    }

    @Override
    public JwtRes login(LoginReq req) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email().trim().toLowerCase(), req.password())
            );
        } catch (AuthenticationException e) {
            throw new BadRequestException("Username or Password is incorrect");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        String token = jwtUtils.generateToken(userDetails.getUsername());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return JwtRes.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(roles)
                .build();
    }
}
