package com.project.app.wallet.repository;

import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.categoryId = :categoryId
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
            @Param("userId") Long userId,
            @Param("type") WalletTransactionType type,
            @Param("categoryId") Long categoryId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCreatedAtRange(
            @Param("userId") Long userId,
            @Param("type") WalletTransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
