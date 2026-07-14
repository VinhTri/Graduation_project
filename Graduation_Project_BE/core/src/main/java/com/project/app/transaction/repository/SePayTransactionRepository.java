package com.project.app.transaction.repository;

import com.project.app.transaction.entity.SePayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SePayTransactionRepository extends JpaRepository<SePayTransaction, Long> {
    boolean existsBySepayId(Long sepayId);
}
