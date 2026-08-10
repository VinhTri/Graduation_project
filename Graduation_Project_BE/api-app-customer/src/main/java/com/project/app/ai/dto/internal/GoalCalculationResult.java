package com.project.app.ai.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalCalculationResult {
    private String goalName;
    private long targetAmount;
    private long currentBalance;
    private long emergencyFund;
    private long usableBalance;
    private DurationInfo duration;

    private SavingPlan usingBalance;
    private SavingPlan keepingBalance;

    private CustomSavingResult customSaving;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomSavingResult {
        private long customMonthlySaving;
        private long projectedAmount;
        private long shortfallAmount;
        private long surplusAmount;
        private boolean isAchievable;
        private double monthsNeededWithBalance;
        private double monthsNeededWithoutBalance;
    }
}
