package com.project.app.transaction.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TopUpResponse {

    private String transferContent;
    private String qrUrl;
    private LocalDateTime expiresAt;
    private BigDecimal amount;
    private LocalDateTime createdAt;
    private String transactionCode;

    public TopUpResponse() {
    }

    public TopUpResponse(String transferContent, String qrUrl, LocalDateTime expiresAt, BigDecimal amount, LocalDateTime createdAt, String transactionCode) {
        this.transferContent = transferContent;
        this.qrUrl = qrUrl;
        this.expiresAt = expiresAt;
        this.amount = amount;
        this.createdAt = createdAt;
        this.transactionCode = transactionCode;
    }

    // Getter và Setter

    public String getTransferContent() {
        return transferContent;
    }

    public void setTransferContent(String transferContent) {
        this.transferContent = transferContent;
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

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }
}
