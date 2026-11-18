package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CardDetailRes(
        Long id,
        Long listId,
        String listTitle,
        String title,
        String description,
        double position,
        LocalDateTime dueDate,
        boolean isDueComplete,
        String coverUrl,
        String coverColor,
        boolean isArchived,
        List<LabelRes> labels,
        List<MemberRes> members,
        List<ChecklistRes> checklists,
        List<AttachmentRes> attachments,
        List<CommentRes> comments,
        List<ActivityRes> activities
) {
}
