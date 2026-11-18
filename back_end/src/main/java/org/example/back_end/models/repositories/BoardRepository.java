package org.example.back_end.models.repositories;

import org.example.back_end.models.entities.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    @Query("""
        SELECT DISTINCT b FROM Board b
        LEFT JOIN b.members bm
        WHERE (b.workspace.owner.id = :userId OR bm.user.id = :userId)
        AND (:workspaceId IS NULL OR b.workspace.id = :workspaceId)
        AND (:starred IS NULL OR b.starred = :starred)
        AND (:search IS NULL OR LOWER(b.title) LIKE LOWER(CAST(CONCAT('%', :search, '%') as string)))
    """)
    List<Board> findAllAccessible(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("starred") Boolean starred,
            @Param("search") String search
    );

    @Query("""
        SELECT DISTINCT b FROM Board b
        LEFT JOIN b.members bm
        WHERE (b.workspace.owner.id = :userId OR bm.user.id = :userId)
    """)
    List<Board> findAllByUserId(@Param("userId") Long userId);
}
