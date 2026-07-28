package com.project.app.budget.dto.response;

import com.project.app.budget.enums.BudgetCycle;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetResponse(
        Long id,
        String name,
        Long categoryId,
        String categoryName,
        String categoryIcon,
        String categoryColor,
        String categoryBgColor,
        Long walletId,
        String walletName,
        BigDecimal amount,
        BigDecimal spentAmount,
        BudgetCycle cycle,
        LocalDate startDate,
        LocalDate endDate,
        boolean isNotified80,
        boolean isNotified100
) {
}
