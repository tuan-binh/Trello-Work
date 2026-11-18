package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.dto.requests.CardCreateReq;
import org.example.back_end.models.dto.requests.CardMoveReq;
import org.example.back_end.models.dto.requests.CardUpdateReq;
import org.example.back_end.models.dto.responses.ActivityRes;
import org.example.back_end.models.dto.responses.AttachmentRes;
import org.example.back_end.models.dto.responses.CardActivitiesRes;
import org.example.back_end.models.dto.responses.CardDetailRes;
import org.example.back_end.models.dto.responses.CardSummaryRes;
import org.example.back_end.models.dto.responses.ChecklistItemRes;
import org.example.back_end.models.dto.responses.ChecklistRes;
import org.example.back_end.models.dto.responses.CommentRes;
import org.example.back_end.models.dto.responses.LabelRes;
import org.example.back_end.models.dto.responses.MemberRes;
import org.example.back_end.models.entities.ActivityLog;
import org.example.back_end.models.entities.Card;
import org.example.back_end.models.entities.Checklist;
import org.example.back_end.models.entities.ChecklistItem;
import org.example.back_end.models.entities.Label;
import org.example.back_end.models.entities.ListEntity;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.repositories.ActivityLogRepository;
import org.example.back_end.models.repositories.CardRepository;
import org.example.back_end.models.repositories.CommentRepository;
import org.example.back_end.models.repositories.LabelRepository;
import org.example.back_end.models.repositories.ListEntityRepository;
import org.example.back_end.models.repositories.UserRepository;
import org.example.back_end.models.services.CardService;
import org.example.back_end.models.services.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {
    private final CardRepository cardRepository;
    private final ListEntityRepository listRepository;
    private final UserRepository userRepository;
    private final LabelRepository labelRepository;
    private final CommentRepository commentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserService userService;

    @Override
    @Transactional
    public CardSummaryRes createCard(Long listId, CardCreateReq req) {
        User currentUser = userService.getCurrentUser();
        ListEntity list = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", "id", listId));

        double position = req.position() != null ? req.position() : 65535.0;
        if (req.position() == null) {
            List<Card> existing = cardRepository.findByListIdOrderByPositionAsc(listId);
            if (!existing.isEmpty()) {
                position = existing.get(existing.size() - 1).getPosition() + 65535.0;
            }
        }

        Card card = new Card();
        card.setList(list);
        card.setTitle(req.title().trim());
        card.setPosition(position);
        card.setArchived(false);
        card.setDueComplete(false);

        card = cardRepository.save(card);

        logActivity(card, currentUser, "đã thêm thẻ này vào", list.getTitle());

        return mapToSummaryRes(card);
    }

    @Override
    @Transactional(readOnly = true)
    public CardDetailRes getCardDetail(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        List<LabelRes> labels = card.getLabels().stream().map(l -> LabelRes.builder()
                .id(l.getId())
                .name(l.getName())
                .color(l.getColor())
                .build()
        ).toList();

        List<MemberRes> members = card.getMembers().stream().map(u -> {
            String initial = u.getFullName() != null && !u.getFullName().isBlank()
                    ? u.getFullName().substring(0, 1).toUpperCase()
                    : "U";
            return MemberRes.builder()
                    .id(u.getId())
                    .name(u.getFullName())
                    .email(u.getEmail())
                    .initials(initial)
                    .avatarBg("bg-blue-600")
                    .role("MEMBER")
                    .status("ACTIVE")
                    .build();
        }).toList();

        List<ChecklistRes> checklists = card.getChecklists().stream()
                .sorted(Comparator.comparingDouble(Checklist::getPosition))
                .map(cl -> {
                    List<ChecklistItemRes> items = cl.getItems().stream()
                            .sorted(Comparator.comparingDouble(ChecklistItem::getPosition))
                            .map(it -> ChecklistItemRes.builder()
                                    .id(it.getId())
                                    .text(it.getContent())
                                    .done(it.isChecked())
                                    .position(it.getPosition())
                                    .build()
                            ).toList();

                    return ChecklistRes.builder()
                            .id(cl.getId())
                            .title(cl.getTitle())
                            .position(cl.getPosition())
                            .items(items)
                            .build();
                }).toList();

        List<AttachmentRes> attachments = card.getAttachments().stream().map(att -> AttachmentRes.builder()
                .id(att.getId())
                .name(att.getFileName())
                .url(att.getFileUrl())
                .size(formatFileSize(att.getFileSize()))
                .isCover(att.isCover())
                .createdAt(att.getCreatedAt())
                .build()
        ).toList();

        List<CommentRes> comments = card.getComments().stream()
                .sorted(Comparator.comparing(org.example.back_end.models.entities.Comment::getCreatedAt).reversed())
                .map(cm -> {
                    User u = cm.getUser();
                    String initial = u.getFullName() != null && !u.getFullName().isBlank()
                            ? u.getFullName().substring(0, 1).toUpperCase()
                            : "U";
                    return CommentRes.builder()
                            .id(cm.getId())
                            .author(u.getFullName())
                            .initials(initial)
                            .avatarBg("bg-blue-600")
                            .text(cm.getContent())
                            .createdAt(cm.getCreatedAt())
                            .build();
                }).toList();

        List<ActivityRes> activities = card.getActivityLogs().stream()
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .map(act -> ActivityRes.builder()
                        .id(act.getId())
                        .author(act.getUser().getFullName())
                        .actionText(act.getActionType())
                        .targetText(act.getDetails())
                        .createdAt(act.getCreatedAt())
                        .build()
                ).toList();

        return CardDetailRes.builder()
                .id(card.getId())
                .listId(card.getList().getId())
                .listTitle(card.getList().getTitle())
                .title(card.getTitle())
                .description(card.getDescription())
                .position(card.getPosition())
                .dueDate(card.getDueDate())
                .isDueComplete(card.isDueComplete())
                .coverUrl(card.getCoverUrl())
                .coverColor(card.getCoverColor())
                .isArchived(card.isArchived())
                .labels(labels)
                .members(members)
                .checklists(checklists)
                .attachments(attachments)
                .comments(comments)
                .activities(activities)
                .build();
    }

    @Override
    @Transactional
    public CardSummaryRes updateCard(Long cardId, CardUpdateReq req) {
        User currentUser = userService.getCurrentUser();
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        if (req.title() != null && !req.title().isBlank()) card.setTitle(req.title().trim());
        if (req.description() != null) card.setDescription(req.description());
        if (req.dueDate() != null) card.setDueDate(req.dueDate());
        if (req.isDueComplete() != null) card.setDueComplete(req.isDueComplete());
        if (req.coverUrl() != null) card.setCoverUrl(req.coverUrl().isBlank() ? null : req.coverUrl());
        if (req.coverColor() != null) card.setCoverColor(req.coverColor().isBlank() ? null : req.coverColor());
        if (req.isArchived() != null) card.setArchived(req.isArchived());

        card = cardRepository.save(card);
        return mapToSummaryRes(card);
    }

    @Override
    @Transactional
    public CardSummaryRes moveCard(Long cardId, CardMoveReq req) {
        User currentUser = userService.getCurrentUser();
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        ListEntity targetList = listRepository.findById(req.targetListId())
                .orElseThrow(() -> new ResourceNotFoundException("List", "id", req.targetListId()));

        String oldListTitle = card.getList().getTitle();
        boolean changedList = !card.getList().getId().equals(targetList.getId());

        card.setList(targetList);
        card.setPosition(req.targetPosition());
        card = cardRepository.save(card);

        if (changedList) {
            logActivity(card, currentUser, "đã chuyển thẻ này từ " + oldListTitle + " sang", targetList.getTitle());
        }

        return mapToSummaryRes(card);
    }

    @Override
    @Transactional
    public void deleteCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));
        // Xóa các logs liên quan đến card trước khi xóa card
        activityLogRepository.deleteByCardId(cardId);
        cardRepository.delete(card);
    }

    @Override
    @Transactional
    public void addMemberToCard(Long cardId, Long userId) {
        User currentUser = userService.getCurrentUser();
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        card.getMembers().add(user);
        cardRepository.save(card);

        logActivity(card, currentUser, "đã thêm thành viên vào thẻ", user.getFullName());
    }

    @Override
    @Transactional
    public void removeMemberFromCard(Long cardId, Long userId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        card.getMembers().remove(user);
        cardRepository.save(card);
    }

    @Override
    @Transactional
    public void addLabelToCard(Long cardId, Long labelId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label", "id", labelId));

        card.getLabels().add(label);
        cardRepository.save(card);
    }

    @Override
    @Transactional
    public void removeLabelFromCard(Long cardId, Long labelId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label", "id", labelId));

        card.getLabels().remove(label);
        cardRepository.save(card);
    }

    @Override
    @Transactional(readOnly = true)
    public CardActivitiesRes getCardActivities(Long cardId) {
        cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        List<CommentRes> comments = commentRepository.findByCardIdOrderByCreatedAtDesc(cardId).stream().map(cm -> {
            User u = cm.getUser();
            String initial = u.getFullName() != null && !u.getFullName().isBlank()
                    ? u.getFullName().substring(0, 1).toUpperCase()
                    : "U";
            return CommentRes.builder()
                    .id(cm.getId())
                    .author(u.getFullName())
                    .initials(initial)
                    .avatarBg("bg-blue-600")
                    .text(cm.getContent())
                    .createdAt(cm.getCreatedAt())
                    .build();
        }).toList();

        List<ActivityRes> activities = activityLogRepository.findByCardIdOrderByCreatedAtDesc(cardId).stream().map(act -> ActivityRes.builder()
                .id(act.getId())
                .author(act.getUser().getFullName())
                .actionText(act.getActionType())
                .targetText(act.getDetails())
                .createdAt(act.getCreatedAt())
                .build()
        ).toList();

        return CardActivitiesRes.builder()
                .comments(comments)
                .activities(activities)
                .build();
    }

    private void logActivity(Card card, User user, String action, String details) {
        ActivityLog log = new ActivityLog();
        log.setBoard(card.getList().getBoard());
        log.setCard(card);
        log.setUser(user);
        log.setActionType(action);
        log.setDetails(details);
        activityLogRepository.save(log);
    }

    private CardSummaryRes mapToSummaryRes(Card c) {
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
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes <= 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}
