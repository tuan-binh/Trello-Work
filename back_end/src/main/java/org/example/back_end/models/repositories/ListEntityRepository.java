package org.example.back_end.models.repositories;

import org.example.back_end.models.entities.ListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ListEntityRepository extends JpaRepository<ListEntity, Long> {
}
