package com.project.app.splitbill.repository;

import com.project.app.splitbill.entity.SplitBill;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SplitBillRepository extends JpaRepository<SplitBill, Long> {

    List<SplitBill> findByCreatorOrderByCreatedAtDesc(User creator);

    @Query("SELECT DISTINCT sb FROM SplitBill sb LEFT JOIN sb.members m WHERE sb.creator = :user OR m.user = :user ORDER BY sb.createdAt DESC")
    List<SplitBill> findAllByUserInvolved(@Param("user") User user);

    @Query("SELECT sb FROM SplitBill sb LEFT JOIN FETCH sb.members WHERE sb.id = :id")
    Optional<SplitBill> findByIdWithMembers(@Param("id") Long id);
}
