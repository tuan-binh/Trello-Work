package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.BadRequestException;
import org.example.back_end.exceptions.ConflictException;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.constants.BoardVisibility;
import org.example.back_end.models.constants.RoleName;
import org.example.back_end.models.constants.RoleScope;
import org.example.back_end.models.dto.requests.BoardCreateReq;
import org.example.back_end.models.dto.requests.BoardUpdateReq;
import org.example.back_end.models.dto.requests.MemberInviteReq;
import org.example.back_end.models.dto.requests.MemberRoleReq;
import org.example.back_end.models.dto.responses.BoardDetailRes;
import org.example.back_end.models.dto.responses.BoardSummaryRes;
import org.example.back_end.models.dto.responses.CardSummaryRes;
import org.example.back_end.models.dto.responses.LabelRes;
import org.example.back_end.models.dto.responses.ListRes;
import org.example.back_end.models.dto.responses.MemberRes;
import org.example.back_end.models.entities.Board;
import org.example.back_end.models.entities.BoardMember;
import org.example.back_end.models.entities.Checklist;
import org.example.back_end.models.entities.ChecklistItem;
import org.example.back_end.models.entities.Label;
import org.example.back_end.models.entities.Role;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.entities.Workspace;
import org.example.back_end.models.repositories.BoardMemberRepository;
import org.example.back_end.models.repositories.BoardRepository;
import org.example.back_end.models.repositories.LabelRepository;
import org.example.back_end.models.repositories.RoleRepository;
import org.example.back_end.models.repositories.UserRepository;
import org.example.back_end.models.repositories.WorkspaceRepository;
import org.example.back_end.models.services.BoardService;
import org.example.back_end.models.services.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LabelRepository labelRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public List<BoardSummaryRes> getBoards(Long workspaceId, String search, Boolean starred) {
        User currentUser = userService.getCurrentUser();
        List<Board> boards = boardRepository.findAllByUserId(currentUser.getId());
        if (workspaceId != null) {
            boards = boards.stream().filter(b -> b.getWorkspace().getId().equals(workspaceId)).toList();
        }
        if (starred != null) {
            boards = boards.stream().filter(b -> b.isStarred() == starred).toList();
        }
        if (search != null && !search.isBlank()) {
            String lower = search.trim().toLowerCase();
            boards = boards.stream().filter(b -> b.getTitle().toLowerCase().contains(lower)).toList();
        }

        return boards.stream().map(b -> BoardSummaryRes.builder()
                .id(b.getId())
                .title(b.getTitle())
                .workspaceId(b.getWorkspace().getId())
                .workspaceName(b.getWorkspace().getName())
                .bgGradient(b.getBgGradient())
                .bgImage(b.getBackgroundUrl())
                .starred(b.isStarred())
                .visibility(b.getVisibility())
                .recentViewed("Vừa xong")
                .build()
        ).toList();
    }

    @Override
    @Transactional
    public BoardSummaryRes createBoard(BoardCreateReq req) {
        User currentUser = userService.getCurrentUser();
        Workspace workspace = null;
        if (req.workspaceId() != null) {
            workspace = workspaceRepository.findById(req.workspaceId()).orElse(null);
        }
        if (workspace == null) {
            // Lấy workspace đầu tiên mà user sở hữu hoặc tham gia
            List<Workspace> myWorkspaces = workspaceRepository.findAllAccessibleByUserId(currentUser.getId());
            if (!myWorkspaces.isEmpty()) {
                workspace = myWorkspaces.get(0);
            } else {
                // Tự động tạo một Workspace mặc định cho User nếu tài khoản chưa có workspace nào
                workspace = new Workspace();
                workspace.setName("Không gian làm việc chính");
                workspace.setSlug("workspace-" + currentUser.getId() + "-" + System.currentTimeMillis());
                workspace.setOwner(currentUser);
                workspace.setDescription("Không gian làm việc mặc định");
                workspace = workspaceRepository.save(workspace);
            }
        }

        Board board = new Board();
        board.setTitle(req.title().trim());
        board.setWorkspace(workspace);
        board.setBackgroundUrl(req.bgImage());
        board.setBgGradient(req.bgGradient());
        board.setVisibility(req.visibility() != null ? req.visibility() : BoardVisibility.WORKSPACE);
        board.setStarred(false);

        board = boardRepository.save(board);

        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseGet(() -> {
            Role r = new Role();
            r.setName(RoleName.ADMIN);
            r.setDescription("Board Admin");
            r.setScope(RoleScope.SYSTEM);
            return roleRepository.save(r);
        });

        BoardMember bm = new BoardMember();
        bm.setBoard(board);
        bm.setUser(currentUser);
        bm.setRole(adminRole);
        bm.setStatus("ACTIVE");
        boardMemberRepository.save(bm);

        createDefaultLabels(board);

        return BoardSummaryRes.builder()
                .id(board.getId())
                .title(board.getTitle())
                .workspaceId(workspace.getId())
                .workspaceName(workspace.getName())
                .bgGradient(board.getBgGradient())
                .bgImage(board.getBackgroundUrl())
                .starred(board.isStarred())
                .visibility(board.getVisibility())
                .recentViewed("Vừa xong")
                .build();
    }

    private void createDefaultLabels(Board board) {
        List<Label> defaults = List.of(
                createLabel(board, "Backend", "bg-blue-500 text-white"),
                createLabel(board, "Frontend", "bg-emerald-500 text-white"),
                createLabel(board, "UI/UX", "bg-pink-500 text-white"),
                createLabel(board, "QA", "bg-amber-500 text-white"),
                createLabel(board, "DevOps", "bg-slate-700 text-white")
        );
        labelRepository.saveAll(defaults);
    }

    private Label createLabel(Board board, String name, String color) {
        Label l = new Label();
        l.setBoard(board);
        l.setName(name);
        l.setColor(color);
        return l;
    }

    @Override
    @Transactional(readOnly = true)
    public BoardDetailRes getBoardDetail(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));

        List<MemberRes> members = board.getMembers().stream().map(m -> {
            User u = m.getUser();
            String initial = u.getFullName() != null && !u.getFullName().isBlank()
                    ? u.getFullName().substring(0, 1).toUpperCase()
                    : "U";
            return MemberRes.builder()
                    .id(m.getId())
                    .name(u.getFullName())
                    .email(u.getEmail())
                    .initials(initial)
                    .avatarBg("bg-blue-600")
                    .role(m.getRole().getName().name())
                    .status(m.getStatus())
                    .build();
        }).toList();

        List<LabelRes> labels = board.getLabels().stream().map(l -> LabelRes.builder()
                .id(l.getId())
                .name(l.getName())
                .color(l.getColor())
                .build()
        ).toList();

        List<ListRes> lists = board.getLists().stream()
                .sorted(Comparator.comparingDouble(org.example.back_end.models.entities.ListEntity::getPosition))
                .map(list -> {
                    List<CardSummaryRes> cards = list.getCards().stream()
                            .sorted(Comparator.comparingDouble(org.example.back_end.models.entities.Card::getPosition))
                            .map(c -> {
                                int total = 0;
                                int done = 0;
                                for (Checklist cl : c.getChecklists()) {
                                    total += cl.getItems().size();
                                    for (ChecklistItem item : cl.getItems()) {
                                        if (item.isChecked()) done++;
                                    }
                                }

                                List<String> memberInitials = c.getMembers().stream()
                                        .map(u -> u.getFullName() != null && !u.getFullName().isBlank()
                                                ? u.getFullName().substring(0, 1).toUpperCase()
                                                : "U")
                                        .toList();

                                List<LabelRes> cardLabels = c.getLabels().stream().map(lb -> LabelRes.builder()
                                        .id(lb.getId())
                                        .name(lb.getName())
                                        .color(lb.getColor())
                                        .build()
                                ).toList();

                                return CardSummaryRes.builder()
                                        .id(c.getId())
                                        .title(c.getTitle())
                                        .description(c.getDescription())
                                        .position(c.getPosition())
                                        .labels(cardLabels)
                                        .checklistTotal(total > 0 ? total : null)
                                        .checklistDone(total > 0 ? done : null)
                                        .commentsCount(c.getComments().size())
                                        .dueDate(c.getDueDate())
                                        .isDueComplete(c.isDueComplete())
                                        .members(memberInitials)
                                        .coverUrl(c.getCoverUrl())
                                        .coverColor(c.getCoverColor())
                                        .isArchived(c.isArchived())
                                        .build();
                            }).toList();

                    return ListRes.builder()
                            .id(list.getId())
                            .title(list.getTitle())
                            .position(list.getPosition())
                            .isArchived(list.isArchived())
                            .cards(cards)
                            .build();
                }).toList();

        return BoardDetailRes.builder()
                .id(board.getId())
                .title(board.getTitle())
                .workspace(board.getWorkspace().getName())
                .workspaceId(board.getWorkspace().getId())
                .bgGradient(board.getBgGradient())
                .bgImage(board.getBackgroundUrl())
                .starred(board.isStarred())
                .visibility(board.getVisibility())
                .members(members)
                .labels(labels)
                .lists(lists)
                .build();
    }

    @Override
    @Transactional
    public BoardSummaryRes updateBoard(Long boardId, BoardUpdateReq req) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));

        if (req.title() != null && !req.title().isBlank()) board.setTitle(req.title().trim());
        if (req.starred() != null) board.setStarred(req.starred());
        if (req.bgGradient() != null) board.setBgGradient(req.bgGradient());
        if (req.bgImage() != null) board.setBackgroundUrl(req.bgImage());
        if (req.visibility() != null) board.setVisibility(req.visibility());

        board = boardRepository.save(board);

        return BoardSummaryRes.builder()
                .id(board.getId())
                .title(board.getTitle())
                .workspaceId(board.getWorkspace().getId())
                .workspaceName(board.getWorkspace().getName())
                .bgGradient(board.getBgGradient())
                .bgImage(board.getBackgroundUrl())
                .starred(board.isStarred())
                .visibility(board.getVisibility())
                .recentViewed("Vừa xong")
                .build();
    }

    @Override
    @Transactional
    public MemberRes inviteMember(Long boardId, MemberInviteReq req) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));

        User targetUser = userRepository.findByEmail(req.email().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + req.email()));

        if (boardMemberRepository.findByBoardIdAndUserId(boardId, targetUser.getId()).isPresent()) {
            throw new ConflictException("Người dùng đã là thành viên của bảng này");
        }

        RoleName roleName = req.role() != null ? req.role() : RoleName.MEMBER;
        Role role = roleRepository.findByName(roleName).orElseGet(() -> {
            Role r = new Role();
            r.setName(roleName);
            r.setDescription("Board " + roleName);
            r.setScope(RoleScope.BOARD);
            return roleRepository.save(r);
        });

        BoardMember bm = new BoardMember();
        bm.setBoard(board);
        bm.setUser(targetUser);
        bm.setRole(role);
        bm.setStatus("ACTIVE");
        bm = boardMemberRepository.save(bm);

        String initial = targetUser.getFullName() != null && !targetUser.getFullName().isBlank()
                ? targetUser.getFullName().substring(0, 1).toUpperCase()
                : "U";

        return MemberRes.builder()
                .id(bm.getId())
                .name(targetUser.getFullName())
                .email(targetUser.getEmail())
                .initials(initial)
                .avatarBg("bg-blue-600")
                .role(bm.getRole().getName().name())
                .status(bm.getStatus())
                .build();
    }

    @Override
    @Transactional
    public MemberRes updateMemberRole(Long boardId, Long memberId, MemberRoleReq req) {
        BoardMember bm = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardMember", "id", memberId));

        if (!bm.getBoard().getId().equals(boardId)) {
            throw new BadRequestException("Thành viên không thuộc bảng này");
        }

        Role role = roleRepository.findByName(req.role()).orElseGet(() -> {
            Role r = new Role();
            r.setName(req.role());
            r.setDescription("Board " + req.role());
            r.setScope(RoleScope.BOARD);
            return roleRepository.save(r);
        });

        bm.setRole(role);
        boardMemberRepository.save(bm);

        User u = bm.getUser();
        String initial = u.getFullName() != null && !u.getFullName().isBlank()
                ? u.getFullName().substring(0, 1).toUpperCase()
                : "U";

        return MemberRes.builder()
                .id(bm.getId())
                .name(u.getFullName())
                .email(u.getEmail())
                .initials(initial)
                .avatarBg("bg-blue-600")
                .role(bm.getRole().getName().name())
                .status(bm.getStatus())
                .build();
    }

    @Override
    @Transactional
    public void removeMember(Long boardId, Long memberId) {
        BoardMember bm = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardMember", "id", memberId));
        if (!bm.getBoard().getId().equals(boardId)) {
            throw new BadRequestException("Thành viên không thuộc bảng này");
        }
        boardMemberRepository.delete(bm);
    }

    @Override
    public Map<String, String> getInviteLink(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));
        return Map.of("inviteUrl", "https://binh.cloud/boards/" + board.getId() + "/join?token=" + System.currentTimeMillis());
    }
}
