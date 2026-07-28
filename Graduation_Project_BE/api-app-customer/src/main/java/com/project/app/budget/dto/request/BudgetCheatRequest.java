package com.project.app.budget.dto.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BudgetCheatRequest(
        @NotNull(message = "Số tiền chi tiêu không được để trống")
        BigDecimal spentAmount
) {
}
