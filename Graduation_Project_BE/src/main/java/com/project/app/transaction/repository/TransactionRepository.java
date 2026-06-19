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

    java.util.List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
