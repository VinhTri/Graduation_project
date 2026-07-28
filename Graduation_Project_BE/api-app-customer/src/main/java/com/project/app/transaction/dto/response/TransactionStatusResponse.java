package com.project.app.transaction.dto.response;

import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionStatusResponse {
    private String transactionCode;
    private TransactionStatus status;
    private TransactionType type;
    private BigDecimal amount;
    private LocalDateTime createdAt;

    public TransactionStatusResponse() {
    }

    public TransactionStatusResponse(String transactionCode, TransactionStatus status, TransactionType type, BigDecimal amount, LocalDateTime createdAt) {
        this.transactionCode = transactionCode;
        this.status = status;
        this.type = type;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
