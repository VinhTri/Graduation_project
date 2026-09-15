package com.project.app.notebook.dto;

import com.project.app.notebook.entity.NotebookTransaction;
import com.project.app.notebook.enums.NotebookTransactionType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class NotebookTransactionResponse {

    String transactionCode;
    Long bookId;
    BigDecimal amount;
    NotebookTransactionType type;
    String note;
    Long categoryId;
    String categoryName;
    String categoryIcon;
    String categoryColor;
    String categoryBgColor;
    /** true nếu danh mục đã soft-delete hoặc không còn tồn tại. */
    boolean categoryDeleted;
    LocalDateTime createdAt;

    public static NotebookTransactionResponse from(NotebookTransaction transaction) {
        return from(transaction, null, null, null, transaction.getCategoryId() != null);
    }

    public static NotebookTransactionResponse from(
            NotebookTransaction transaction,
            String categoryIcon,
            String categoryColor,
            String categoryBgColor,
            boolean categoryDeleted) {
        return NotebookTransactionResponse.builder()
                .transactionCode(transaction.getTransactionCode())
                .bookId(transaction.getBook().getId())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .note(transaction.getNote())
                .categoryId(transaction.getCategoryId())
                .categoryName(transaction.getCategoryName())
                .categoryIcon(categoryIcon)
                .categoryColor(categoryColor)
                .categoryBgColor(categoryBgColor)
                .categoryDeleted(categoryDeleted)
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
