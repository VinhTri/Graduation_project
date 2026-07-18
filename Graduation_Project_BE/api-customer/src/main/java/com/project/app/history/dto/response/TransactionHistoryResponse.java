package com.project.app.history.dto.response;

import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionHistoryResponse {
    private String transactionCode;
    private TransactionType type;
    private TransactionStatus status;
    private BigDecimal amount;
    private String note;
    private Long categoryId;
    private String categoryLabel;
    private String categoryIcon;
    private String categoryColor;
    private Boolean categoryDeleted;
    private LocalDateTime createdAt;

    public TransactionHistoryResponse() {
    }

    public TransactionHistoryResponse(String transactionCode, TransactionType type, TransactionStatus status,
                                      BigDecimal amount, String note, Long categoryId,
                                      String categoryLabel, String categoryIcon, Boolean categoryDeleted,
                                      LocalDateTime createdAt) {
        this(transactionCode, type, status, amount, note, categoryId, categoryLabel, categoryIcon, null, categoryDeleted, createdAt);
    }

    public TransactionHistoryResponse(String transactionCode, TransactionType type, TransactionStatus status,
                                      BigDecimal amount, String note, Long categoryId,
                                      String categoryLabel, String categoryIcon, String categoryColor,
                                      Boolean categoryDeleted, LocalDateTime createdAt) {
        this.transactionCode = transactionCode;
        this.type = type;
        this.status = status;
        this.amount = amount;
        this.note = note;
        this.categoryId = categoryId;
        this.categoryLabel = categoryLabel;
        this.categoryIcon = categoryIcon;
        this.categoryColor = categoryColor;
        this.categoryDeleted = categoryDeleted;
        this.createdAt = createdAt;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryLabel() {
        return categoryLabel;
    }

    public void setCategoryLabel(String categoryLabel) {
        this.categoryLabel = categoryLabel;
    }

    public String getCategoryIcon() {
        return categoryIcon;
    }

    public void setCategoryIcon(String categoryIcon) {
        this.categoryIcon = categoryIcon;
    }

    public String getCategoryColor() {
        return categoryColor;
    }

    public void setCategoryColor(String categoryColor) {
        this.categoryColor = categoryColor;
    }

    public Boolean getCategoryDeleted() {
        return categoryDeleted;
    }

    public void setCategoryDeleted(Boolean categoryDeleted) {
        this.categoryDeleted = categoryDeleted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
