package org.example.back_end.models.repositories;

import org.example.back_end.models.entities.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);
    List<BoardMember> findByBoardId(Long boardId);
}
