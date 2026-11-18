package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.models.constants.RoleName;
import org.example.back_end.models.constants.RoleScope;
import org.example.back_end.models.dto.requests.WorkspaceReq;
import org.example.back_end.models.dto.responses.WorkspaceRes;
import org.example.back_end.models.entities.Role;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.entities.Workspace;
import org.example.back_end.models.entities.WorkspaceMember;
import org.example.back_end.models.repositories.RoleRepository;
import org.example.back_end.models.repositories.WorkspaceMemberRepository;
import org.example.back_end.models.repositories.WorkspaceRepository;
import org.example.back_end.models.services.UserService;
import org.example.back_end.models.services.WorkspaceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final RoleRepository roleRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceRes> getAllMyWorkspaces() {
        User currentUser = userService.getCurrentUser();
        List<Workspace> workspaces = workspaceRepository.findAllAccessibleByUserId(currentUser.getId());

        return workspaces.stream().map(w -> {
            String role = "MEMBER";
            if (w.getOwner().getId().equals(currentUser.getId())) {
                role = "ADMIN";
            } else {
                for (WorkspaceMember wm : w.getMembers()) {
                    if (wm.getUser().getId().equals(currentUser.getId())) {
                        role = wm.getRole().getName().name();
                        break;
                    }
                }
            }
            return WorkspaceRes.builder()
                    .id(w.getId())
                    .name(w.getName())
                    .slug(w.getSlug())
                    .description(w.getDescription())
                    .currentUserRole(role)
                    .build();
        }).toList();
    }

    @Override
    @Transactional
    public WorkspaceRes createWorkspace(WorkspaceReq req) {
        User currentUser = userService.getCurrentUser();

        String baseSlug = toSlug(req.name());
        String slug = baseSlug;
        int count = 1;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }

        Workspace workspace = new Workspace();
        workspace.setName(req.name().trim());
        workspace.setSlug(slug);
        workspace.setDescription(req.description());
        workspace.setOwner(currentUser);

        workspace = workspaceRepository.save(workspace);

        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseGet(() -> {
            Role r = new Role();
            r.setName(RoleName.ADMIN);
            r.setDescription("Workspace Admin");
            r.setScope(RoleScope.SYSTEM);
            return roleRepository.save(r);
        });

        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspace(workspace);
        member.setUser(currentUser);
        member.setRole(adminRole);
        workspaceMemberRepository.save(member);

        return WorkspaceRes.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .description(workspace.getDescription())
                .currentUserRole("ADMIN")
                .build();
    }

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private String toSlug(String input) {
        if (input == null || input.isBlank()) return "workspace-" + System.currentTimeMillis();
        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);
        return slug.isBlank() ? "workspace-" + System.currentTimeMillis() : slug;
    }
}
