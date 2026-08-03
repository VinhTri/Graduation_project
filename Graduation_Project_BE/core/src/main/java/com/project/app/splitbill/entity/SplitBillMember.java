package com.project.app.splitbill.entity;

import com.project.app.splitbill.enums.SplitBillMemberStatus;
import com.project.app.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "split_bill_members")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitBillMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "split_bill_id", nullable = false)
    private SplitBill splitBill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private SplitBillMemberStatus status = SplitBillMemberStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "transaction_code", length = 100)
    private String transactionCode;

    @Column(name = "last_reminded_at")
    private LocalDateTime lastRemindedAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
