package com.project.app.transaction.repository;

import com.project.app.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByTransactionCode(String transactionCode);
    
    Optional<Transaction> findFirstByUserAndTypeAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            com.project.app.user.entity.User user, 
            com.project.app.transaction.entity.TransactionType type, 
            com.project.app.transaction.entity.TransactionStatus status, 
            java.time.LocalDateTime createdAt
    );

    java.util.List<Transaction> findByUserAndTypeAndStatusAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            com.project.app.transaction.entity.TransactionType type,
            com.project.app.transaction.entity.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    java.util.List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.wallet.id = :walletId " +
           "AND t.type IN :types AND t.status = :status AND t.createdAt >= :startOfDay")
    java.math.BigDecimal sumDailyTransactedAmount(
            @org.springframework.data.repository.query.Param("walletId") Long walletId, 
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.entity.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.entity.TransactionStatus status,
            @org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay
    );
}
