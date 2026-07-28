package com.project.app.budget.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BudgetUpdateRequest(
        @NotBlank(message = "Tên ngân sách không được để trống")
        String name,

        @NotNull(message = "Hạn mức không được để trống")
        @Positive(message = "Hạn mức phải lớn hơn 0")
        BigDecimal amount
) {
}
