package org.example.back_end.models.repositories;

import org.example.back_end.models.entities.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByCardIdOrderByCreatedAtDesc(Long cardId);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.card.id = :cardId")
    void deleteByCardId(@Param("cardId") Long cardId);
}
