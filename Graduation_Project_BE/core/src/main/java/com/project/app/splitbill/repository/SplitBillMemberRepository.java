package com.project.app.splitbill.repository;

import com.project.app.splitbill.entity.SplitBillMember;
import com.project.app.splitbill.enums.SplitBillMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SplitBillMemberRepository extends JpaRepository<SplitBillMember, Long> {

    List<SplitBillMember> findBySplitBillId(Long splitBillId);

    Optional<SplitBillMember> findBySplitBillIdAndUserId(Long splitBillId, Long userId);

    List<SplitBillMember> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, SplitBillMemberStatus status);
}
