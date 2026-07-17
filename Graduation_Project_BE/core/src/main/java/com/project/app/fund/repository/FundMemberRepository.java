package com.project.app.fund.repository;

import com.project.app.fund.entity.FundMember;
import com.project.app.fund.enums.FundMemberRole;
import com.project.app.fund.enums.FundMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FundMemberRepository extends JpaRepository<FundMember, Long> {

    List<FundMember> findByFundIdAndStatusNotOrderByJoinedAtAsc(Long fundId, FundMemberStatus status);

    long countByFundIdAndStatus(Long fundId, FundMemberStatus status);

    long countByFundIdAndStatusIn(Long fundId, List<FundMemberStatus> statuses);

    Optional<FundMember> findByFundIdAndUserId(Long fundId, Long userId);

    List<FundMember> findByFundIdAndStatus(Long fundId, FundMemberStatus status);

    @Query("""
            SELECT COUNT(m) FROM FundMember m
            WHERE m.user.id = :userId
              AND m.status = :status
              AND m.role <> :ownerRole
            """)
    long countJoinedFunds(
            @Param("userId") Long userId,
            @Param("status") FundMemberStatus status,
            @Param("ownerRole") FundMemberRole ownerRole
    );

    @Modifying
    @Transactional
    void deleteByFundId(Long fundId);
}
