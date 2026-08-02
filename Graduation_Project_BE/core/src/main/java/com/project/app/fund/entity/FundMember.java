package com.project.app.fund.entity;

import com.project.app.fund.enums.FundMemberRole;
import com.project.app.fund.enums.FundMemberStatus;
import com.project.app.user.entity.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "fund_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"fund_id", "user_id"})
)
public class FundMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_id", nullable = false)
    private Fund fund;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FundMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FundMemberStatus status = FundMemberStatus.ACTIVE;

    @Column(name = "contributed_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal contributedAmount = BigDecimal.ZERO;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();

    public FundMember() {
    }

    public Long getId() {
        return id;
    }

    public Fund getFund() {
        return fund;
    }

    public void setFund(Fund fund) {
        this.fund = fund;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public FundMemberRole getRole() {
        return role;
    }

    public void setRole(FundMemberRole role) {
        this.role = role;
    }

    public FundMemberStatus getStatus() {
        return status;
    }

    public void setStatus(FundMemberStatus status) {
        this.status = status;
    }

    public BigDecimal getContributedAmount() {
        return contributedAmount;
    }

    public void setContributedAmount(BigDecimal contributedAmount) {
        this.contributedAmount = contributedAmount;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
