package com.project.app.transaction.dto.response;

import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ManualTransactionResponse(
        String transactionCode,
        TransactionType type,
        TransactionStatus status,
        BigDecimal amount,
        Long categoryId,
        String note,
        BigDecimal cashBalance,
        LocalDateTime createdAt
) {
}
