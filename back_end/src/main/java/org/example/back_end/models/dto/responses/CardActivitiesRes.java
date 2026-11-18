package org.example.back_end.models.dto.responses;

import lombok.Builder;

import java.util.List;

@Builder
public record CardActivitiesRes(
        List<CommentRes> comments,
        List<ActivityRes> activities
) {
}
