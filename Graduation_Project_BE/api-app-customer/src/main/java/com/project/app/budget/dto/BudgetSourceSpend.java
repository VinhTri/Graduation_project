package com.project.app.budget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSourceSpend {

    private BigDecimal limitAmount;
    private BigDecimal spent;
    /** Có thể âm khi vượt hạn mức. */
    private BigDecimal remaining;
    private boolean overLimit;
}
