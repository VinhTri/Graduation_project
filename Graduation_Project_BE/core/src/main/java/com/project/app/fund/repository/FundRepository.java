package com.project.app.fund.repository;

import com.project.app.fund.entity.Fund;
import com.project.app.fund.enums.FundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface FundRepository extends JpaRepository<Fund, Long> {

    long countByOwnerIdAndStatus(Long ownerId, FundStatus status);

    boolean existsByOwnerIdAndCoverColorSeedAndStatus(Long ownerId, int coverColorSeed, FundStatus status);

    @Query("""
            SELECT DISTINCT f FROM Fund f
            JOIN FundMember m ON m.fund = f
            WHERE m.user.id = :userId
              AND m.status = com.project.app.fund.enums.FundMemberStatus.ACTIVE
              AND f.status = com.project.app.fund.enums.FundStatus.ACTIVE
            ORDER BY f.createdAt DESC
            """)
    List<Fund> findActiveFundsForUser(@Param("userId") Long userId);

    Optional<Fund> findByIdAndStatus(Long id, FundStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT f FROM Fund f
            WHERE f.id = :fundId
              AND f.status = com.project.app.fund.enums.FundStatus.ACTIVE
            """)
    Optional<Fund> findActiveFundForUpdate(@Param("fundId") Long fundId);
}
