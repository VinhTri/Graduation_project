package com.project.app.fund.repository;

import com.project.app.fund.entity.FundTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FundTransactionRepository extends JpaRepository<FundTransaction, Long> {

    List<FundTransaction> findByFundIdOrderByCreatedAtDesc(Long fundId);

    Optional<FundTransaction> findByIdAndFundId(Long id, Long fundId);

    Optional<FundTransaction> findByFundIdAndUserIdAndRequestId(Long fundId, Long userId, String requestId);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM FundTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.createdAt >= :from
              AND t.createdAt <= :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCreatedAtBetween(
            @Param("userId") Long userId,
            @Param("type") com.project.app.fund.enums.FundTransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Modifying
    @Transactional
    void deleteByFundId(Long fundId);
}
