package com.project.app.notebook.repository;

import com.project.app.notebook.entity.NotebookTransaction;
import com.project.app.notebook.enums.NotebookTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotebookTransactionRepository extends JpaRepository<NotebookTransaction, Long> {

    List<NotebookTransaction> findAllByBookIdAndUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long bookId,
            Long userId,
            LocalDateTime from,
            LocalDateTime to
    );

    Optional<NotebookTransaction> findByTransactionCodeAndUserId(String transactionCode, Long userId);

    boolean existsByUserIdAndCreatedAtBetween(Long userId, LocalDateTime from, LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM NotebookTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.createdAt >= :from
              AND t.createdAt <= :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCreatedAtBetween(
            @Param("userId") Long userId,
            @Param("type") NotebookTransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM NotebookTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.categoryId = :categoryId
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
            @Param("userId") Long userId,
            @Param("type") NotebookTransactionType type,
            @Param("categoryId") Long categoryId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
