package com.project.app.transaction.repository;

import com.project.app.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t JOIN FETCH t.user JOIN FETCH t.wallet ORDER BY t.createdAt DESC")
    List<Transaction> findAllWithUserAndWalletOrderByCreatedAtDesc();

    Optional<Transaction> findByTransactionCode(String transactionCode);
    
    Optional<Transaction> findFirstByUserAndTypeAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            com.project.app.user.entity.User user, 
            com.project.app.transaction.enums.TransactionType type, 
            com.project.app.transaction.enums.TransactionStatus status, 
            java.time.LocalDateTime createdAt
    );

    java.util.List<Transaction> findByUserAndTypeAndStatusAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            com.project.app.transaction.enums.TransactionType type,
            com.project.app.transaction.enums.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    java.util.List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    java.util.List<Transaction> findByTypeAndNoteContainingIgnoreCaseOrderByCreatedAtDesc(
            com.project.app.transaction.enums.TransactionType type,
            String note
    );

    java.util.List<Transaction> findByUserIdAndWallet_IsDefaultTrueOrderByCreatedAtDesc(Long userId);

    java.util.List<Transaction> findByUserIdAndWalletIdOrderByCreatedAtDesc(Long userId, Long walletId);

    void deleteAllByWalletId(Long walletId);

    boolean existsByUserIdAndCreatedAtBetween(Long userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);

    java.util.List<Transaction> findByUserAndTypeAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            com.project.app.transaction.enums.TransactionType type,
            com.project.app.transaction.enums.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    java.util.List<Transaction> findByUserAndTypeInAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            java.util.List<com.project.app.transaction.enums.TransactionType> types,
            com.project.app.transaction.enums.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.wallet.id = :walletId " +
           "AND t.type IN :types AND t.status = :status AND t.createdAt >= :startOfDay")
    java.math.BigDecimal sumDailyTransactedAmount(
            @org.springframework.data.repository.query.Param("walletId") Long walletId, 
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay
    );

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.wallet.id = :walletId
              AND t.type = :type
              AND t.status = :status
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    java.math.BigDecimal sumAmountByWalletAndTypeAndCreatedAtRange(
            @org.springframework.data.repository.query.Param("walletId") Long walletId,
            @org.springframework.data.repository.query.Param("type") com.project.app.transaction.enums.TransactionType type,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.wallet.isDefault = true
              AND t.type IN :types
              AND t.status = :status
              AND t.createdAt >= :from
              AND t.createdAt <= :to
            """)
    java.math.BigDecimal sumAmountByUserDefaultWalletAndTypesAndStatusAndCreatedAtBetween(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.type IN :types
              AND t.status = :status
              AND t.categoryId = :categoryId
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    java.math.BigDecimal sumAmountByUserAndTypesAndStatusAndCategoryAndCreatedAtRange(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );
}
