package com.project.app.budget.dto.request;

import com.project.app.budget.enums.BudgetCycle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetCreateRequest(
        @NotBlank(message = "Tên ngân sách không được để trống")
        String name,

        @NotNull(message = "Danh mục không được để trống")
        Long categoryId,

        Long walletId, // Optional

        @NotNull(message = "Hạn mức không được để trống")
        @Positive(message = "Hạn mức phải lớn hơn 0")
        BigDecimal amount,

        @NotNull(message = "Chu kỳ không được để trống")
        BudgetCycle cycle,

        LocalDate startDate,
        
        LocalDate endDate
) {
}
