package com.project.app.transaction.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TopUpRequest(
        Long walletId,
        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền nạp tối thiểu là 0.01")
        BigDecimal amount,
        String note,
        Long categoryId
) {
}
