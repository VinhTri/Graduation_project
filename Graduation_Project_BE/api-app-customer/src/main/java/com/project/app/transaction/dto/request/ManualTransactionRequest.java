package com.project.app.transaction.dto.request;

import com.project.app.transaction.enums.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

import java.time.LocalDateTime;

public record ManualTransactionRequest(
        @NotNull(message = "Số tiền là bắt buộc")
        @DecimalMin(value = "1", message = "Số tiền phải lớn hơn 0")
        BigDecimal amount,

        @NotNull(message = "Loại giao dịch là bắt buộc")
        TransactionType type,

        @NotNull(message = "Danh mục là bắt buộc")
        Long categoryId,

        String note,
        
        Long walletId,

        LocalDateTime createdAt
) {
}
