package com.project.app.ai.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalContext {

    private String goalName;
    private long targetAmount;
    private int durationMonths;
    private int durationDays;
    private boolean isDays;
    private String originalTimeText;
    private BigDecimal currentBalance;
    private long userDeclaredBalance;
    private long emergencyFund;
    private long usableBalance;
    private boolean useCurrentBalance;
    private long remainingAmount;
    // Option 1: dùng số dư
    private long monthlySavingWithBalance;
    private long dailySavingWithBalance;

    // Option 2: không dùng số dư
    private long monthlySavingWithoutBalance;
    private long dailySavingWithoutBalance;

    // User prompt: "nếu chỉ tiết kiệm X/tháng"
    private long customMonthlySaving;

    // Custom saving result
    private long projectedAmount;
    private long surplusAmount;
    private long shortfallAmount;
    private boolean isAchievable;

    // Time required with custom saving
    private long monthsNeededWithBalance;
    private long monthsNeededWithoutBalance;
    private long daysNeededWithBalance;
    private long daysNeededWithoutBalance;

    private boolean isNewGoal;
    private boolean isGoalQuery;

    // Backward compatibility aliases
    public long getMonthlyGapSaving() {
        return monthlySavingWithBalance;
    }

    public long getMonthlySaving() {
        return monthlySavingWithoutBalance;
    }
}
