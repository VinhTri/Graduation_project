package com.project.app.ai.calculator;

import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.GoalCalculationResult;
import com.project.app.ai.dto.internal.SavingPlan;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
public class GoalCalculator {

    public GoalCalculationResult calculatePlan(
            String goalName,
            long targetAmount,
            DurationInfo duration,
            BigDecimal userTotalBalance,
            long userDeclaredBalance,
            long emergencyFund,
            boolean useCurrentBalance,
            long customMonthlySaving
    ) {
        long balanceVal = 0;
        if (userDeclaredBalance > 0) {
            balanceVal = userDeclaredBalance;
        } else if (useCurrentBalance && userTotalBalance != null) {
            balanceVal = userTotalBalance.longValue();
        }

        long usableBalance = Math.max(0, balanceVal - emergencyFund);

        int months = duration != null && duration.getMonths() != null ? Math.max(1, duration.getMonths()) : 12;
        int days = duration != null && duration.getDays() != null ? Math.max(1, duration.getDays()) : months * 30;

        // Plan 1: Dùng số dư hiện có
        long remainingWithBal = Math.max(0, targetAmount - usableBalance);
        long monthlySavingWithBal = (long) Math.ceil((double) remainingWithBal / months);
        long dailySavingWithBal = (long) Math.ceil((double) remainingWithBal / days);

        SavingPlan usingBalPlan = SavingPlan.builder()
                .initialAmount(usableBalance)
                .remainingAmount(remainingWithBal)
                .monthlySaving(monthlySavingWithBal)
                .dailySaving(dailySavingWithBal)
                .monthsNeeded(months)
                .daysNeeded(days)
                .build();

        // Plan 2: Giữ nguyên số dư hiện có (Không dùng số dư)
        long remainingKeepBal = targetAmount;
        long monthlySavingKeepBal = (long) Math.ceil((double) remainingKeepBal / months);
        long dailySavingKeepBal = (long) Math.ceil((double) remainingKeepBal / days);

        SavingPlan keepingBalPlan = SavingPlan.builder()
                .initialAmount(0)
                .remainingAmount(remainingKeepBal)
                .monthlySaving(monthlySavingKeepBal)
                .dailySaving(dailySavingKeepBal)
                .monthsNeeded(months)
                .daysNeeded(days)
                .build();

        // Custom Saving Scenario (nếu user chỉ tiết kiệm X / tháng)
        GoalCalculationResult.CustomSavingResult customResult = null;
        if (customMonthlySaving > 0) {
            long initialToUse = useCurrentBalance ? usableBalance : 0;
            long projected = initialToUse + (customMonthlySaving * months);
            long shortfall = Math.max(0, targetAmount - projected);
            long surplus = Math.max(0, projected - targetAmount);
            boolean isAchievable = projected >= targetAmount;

            double monthsNeededWithBal = customMonthlySaving > 0 ? (double) Math.max(0, targetAmount - usableBalance) / customMonthlySaving : 0;
            double monthsNeededKeepBal = customMonthlySaving > 0 ? (double) targetAmount / customMonthlySaving : 0;

            customResult = GoalCalculationResult.CustomSavingResult.builder()
                    .customMonthlySaving(customMonthlySaving)
                    .projectedAmount(projected)
                    .shortfallAmount(shortfall)
                    .surplusAmount(surplus)
                    .isAchievable(isAchievable)
                    .monthsNeededWithBalance(Math.round(monthsNeededWithBal * 10.0) / 10.0)
                    .monthsNeededWithoutBalance(Math.round(monthsNeededKeepBal * 10.0) / 10.0)
                    .build();
        }

        return GoalCalculationResult.builder()
                .goalName(goalName != null ? goalName : "Mục tiêu tài chính")
                .targetAmount(targetAmount)
                .currentBalance(balanceVal)
                .emergencyFund(emergencyFund)
                .usableBalance(usableBalance)
                .duration(duration)
                .usingBalance(usingBalPlan)
                .keepingBalance(keepingBalPlan)
                .customSaving(customResult)
                .build();
    }
}
