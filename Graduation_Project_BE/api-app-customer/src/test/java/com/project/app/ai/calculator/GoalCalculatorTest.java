package com.project.app.ai.calculator;

import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.GoalCalculationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class GoalCalculatorTest {

    private GoalCalculator goalCalculator;

    @BeforeEach
    void setUp() {
        goalCalculator = new GoalCalculator();
    }

    @Test
    @DisplayName("Tính toán mục tiêu mua ô tô 300 triệu trong 9 tháng với số dư 11.083.444 VNĐ")
    void testCalculateCarGoalPlan() {
        DurationInfo duration = DurationInfo.builder()
                .originalText("9 tháng")
                .months(9)
                .days(270)
                .type(DurationInfo.DurationType.MONTHS)
                .build();

        BigDecimal userBalance = new BigDecimal("11083444");

        GoalCalculationResult result = goalCalculator.calculatePlan(
                "ô tô",
                300_000_000L,
                duration,
                userBalance,
                0L,
                0L,
                true,
                0L
        );

        assertNotNull(result);
        assertEquals("ô tô", result.getGoalName());
        assertEquals(300_000_000L, result.getTargetAmount());
        assertEquals(11_083_444L, result.getCurrentBalance());

        // Usable balance = 11,083,444
        // Remaining = 300,000,000 - 11,083,444 = 288,916,556
        // Monthly saving with balance = ceil(288,916,556 / 9) = 32,101,840
        assertNotNull(result.getUsingBalance());
        assertEquals(288_916_556L, result.getUsingBalance().getRemainingAmount());
        assertEquals(32_101_840L, result.getUsingBalance().getMonthlySaving());

        // Without balance
        // Monthly saving keeping balance = ceil(300,000,000 / 9) = 33,333,334
        assertNotNull(result.getKeepingBalance());
        assertEquals(300_000_000L, result.getKeepingBalance().getRemainingAmount());
        assertEquals(33_333_334L, result.getKeepingBalance().getMonthlySaving());
    }

    @Test
    @DisplayName("Tính toán kịch bản tiết kiệm tùy chỉnh 10 triệu/tháng")
    void testCustomMonthlySavingScenario() {
        DurationInfo duration = DurationInfo.builder()
                .originalText("12 tháng")
                .months(12)
                .days(360)
                .type(DurationInfo.DurationType.MONTHS)
                .build();

        BigDecimal userBalance = new BigDecimal("20000000");

        GoalCalculationResult result = goalCalculator.calculatePlan(
                "mua nhà",
                300_000_000L,
                duration,
                userBalance,
                0L,
                0L,
                true,
                10_000_000L // 10 tr / tháng
        );

        assertNotNull(result.getCustomSaving());
        assertFalse(result.getCustomSaving().isAchievable());
        // Projected = 20M + (10M * 12) = 140M
        assertEquals(140_000_000L, result.getCustomSaving().getProjectedAmount());
        // Shortfall = 300M - 140M = 160M
        assertEquals(160_000_000L, result.getCustomSaving().getShortfallAmount());
    }
}
