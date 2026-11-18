package org.example.back_end.models.repositories;

import org.example.back_end.models.entities.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    boolean existsBySlug(String slug);

    @Query("""
        SELECT DISTINCT w FROM Workspace w
        LEFT JOIN w.members wm
        WHERE w.owner.id = :userId OR wm.user.id = :userId
    """)
    List<Workspace> findAllAccessibleByUserId(@Param("userId") Long userId);
}
