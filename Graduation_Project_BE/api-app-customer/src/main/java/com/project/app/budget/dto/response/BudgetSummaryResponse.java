package com.project.app.budget.dto.response;

import java.math.BigDecimal;

public record BudgetSummaryResponse(
        BigDecimal totalLimit,
        BigDecimal totalSpent,
        BigDecimal remaining,
        int warningCount
) {
}
