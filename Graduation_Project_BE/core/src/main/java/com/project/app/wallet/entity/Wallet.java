package com.project.app.wallet.entity;

import com.project.app.user.entity.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "account_number", unique = true, length = 50)
    private String accountNumber;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @Column(name = "is_deletable", nullable = false)
    private boolean isDeletable = true;

    @Column(name = "is_limit_enabled", nullable = false)
    private boolean isLimitEnabled = false;

    @Column(name = "transaction_limit")
    private BigDecimal transactionLimit;

    @Column(name = "daily_limit")
    private BigDecimal dailyLimit;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    public Wallet() {
    }

    public Wallet(User user, String name, BigDecimal balance, boolean isDefault, boolean isDeletable) {
        this.user = user;
        this.name = name;
        this.balance = balance != null ? balance : BigDecimal.ZERO;
        this.isDefault = isDefault;
        this.isDeletable = isDeletable;
    }

    // Getter và Setter

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public void addBalance(BigDecimal amount) {
        if (amount != null) {
            this.balance = this.balance.add(amount);
        }
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }

    public boolean isDeletable() {
        return isDeletable;
    }

    public void setDeletable(boolean isDeletable) {
        this.isDeletable = isDeletable;
    }

    public boolean isLimitEnabled() {
        return isLimitEnabled;
    }

    public void setLimitEnabled(boolean limitEnabled) {
        isLimitEnabled = limitEnabled;
    }

    public BigDecimal getTransactionLimit() {
        return transactionLimit;
    }

    public void setTransactionLimit(BigDecimal transactionLimit) {
        this.transactionLimit = transactionLimit;
    }

    public BigDecimal getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(BigDecimal dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
