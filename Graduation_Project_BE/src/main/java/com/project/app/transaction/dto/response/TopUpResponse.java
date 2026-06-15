package com.project.app.transaction.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TopUpResponse {

    private String transactionCode;
    private String qrUrl;
    private LocalDateTime expiresAt;
    private BigDecimal amount;
    private LocalDateTime createdAt;

    public TopUpResponse() {
    }

    public TopUpResponse(String transactionCode, String qrUrl, LocalDateTime expiresAt, BigDecimal amount, LocalDateTime createdAt) {
        this.transactionCode = transactionCode;
        this.qrUrl = qrUrl;
        this.expiresAt = expiresAt;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    // Getters and Setters

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public String getQrUrl() {
        return qrUrl;
    }

    public void setQrUrl(String qrUrl) {
        this.qrUrl = qrUrl;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
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
