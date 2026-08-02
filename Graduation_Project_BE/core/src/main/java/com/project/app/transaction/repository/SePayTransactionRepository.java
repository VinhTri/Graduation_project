package com.project.app.transaction.repository;

import com.project.app.transaction.entity.SePayTransaction;
import com.project.app.transaction.enums.SePayMatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SePayTransactionRepository extends JpaRepository<SePayTransaction, Long> {
    boolean existsBySepayId(Long sepayId);

    Optional<SePayTransaction> findBySepayId(Long sepayId);

    Optional<SePayTransaction> findByTransaction_Id(Long transactionId);

    List<SePayTransaction> findAllByOrderByCreatedAtDesc();

    List<SePayTransaction> findByMatchStatusOrderByCreatedAtDesc(SePayMatchStatus matchStatus);

    long countByMatchStatus(SePayMatchStatus matchStatus);

    @Query("SELECT s FROM SePayTransaction s LEFT JOIN FETCH s.transaction t LEFT JOIN FETCH t.user LEFT JOIN FETCH t.wallet ORDER BY s.createdAt DESC")
    List<SePayTransaction> findAllWithDetailsOrderByCreatedAtDesc();
}
