package org.example.back_end.models.repositories;

import org.example.back_end.models.entities.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByCardIdOrderByCreatedAtDesc(Long cardId);
}
