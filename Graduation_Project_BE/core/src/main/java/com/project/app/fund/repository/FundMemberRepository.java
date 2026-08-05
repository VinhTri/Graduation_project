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

    @Query("""
            SELECT m FROM FundMember m
            JOIN FETCH m.fund f
            JOIN FETCH f.owner o
            WHERE m.user.id = :userId
              AND m.status = com.project.app.fund.enums.FundMemberStatus.INVITED
              AND f.status = com.project.app.fund.enums.FundStatus.ACTIVE
            ORDER BY m.id DESC
            """)
    List<FundMember> findPendingInvitationsForUser(@Param("userId") Long userId);

    @Modifying
    @Transactional
    void deleteByFundId(Long fundId);
}
