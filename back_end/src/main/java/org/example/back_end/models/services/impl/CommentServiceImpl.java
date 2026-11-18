package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.dto.requests.CommentReq;
import org.example.back_end.models.dto.responses.CommentRes;
import org.example.back_end.models.entities.Card;
import org.example.back_end.models.entities.Comment;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.repositories.CardRepository;
import org.example.back_end.models.repositories.CommentRepository;
import org.example.back_end.models.services.CommentService;
import org.example.back_end.models.services.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {
    private final CommentRepository commentRepository;
    private final CardRepository cardRepository;
    private final UserService userService;

    @Override
    @Transactional
    public CommentRes addComment(Long cardId, CommentReq req) {
        User currentUser = userService.getCurrentUser();
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        Comment comment = new Comment();
        comment.setCard(card);
        comment.setUser(currentUser);
        comment.setContent(req.text().trim());
        comment = commentRepository.save(comment);

        String initial = currentUser.getFullName() != null && !currentUser.getFullName().isBlank()
                ? currentUser.getFullName().substring(0, 1).toUpperCase()
                : "U";

        return CommentRes.builder()
                .id(comment.getId())
                .author(currentUser.getFullName())
                .initials(initial)
                .avatarBg("bg-blue-600")
                .text(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
