package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.CommentReq;
import org.example.back_end.models.dto.responses.CommentRes;

public interface CommentService {
    CommentRes addComment(Long cardId, CommentReq req);
}
