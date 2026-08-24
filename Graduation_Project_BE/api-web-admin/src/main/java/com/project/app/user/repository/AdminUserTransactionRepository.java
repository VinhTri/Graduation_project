package com.project.app.user.repository;

import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface AdminUserTransactionRepository extends Repository<Transaction, Long> {
    Page<Transaction> findByUserIdAndTypeInOrderByCreatedAtDesc(Long userId, List<TransactionType> types, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id=:userId AND t.type=:type AND t.status=:status")
    BigDecimal sumByUserAndTypeAndStatus(@Param("userId") Long userId, @Param("type") TransactionType type, @Param("status") TransactionStatus status);
}
