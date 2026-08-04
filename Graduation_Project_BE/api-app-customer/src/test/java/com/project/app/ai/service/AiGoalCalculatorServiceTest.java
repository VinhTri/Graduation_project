package com.project.app.ai.service;

import com.project.app.ai.dto.internal.GoalContext;
import com.project.app.ai.parser.AmountParser;
import com.project.app.ai.parser.DurationParser;
import com.project.app.ai.parser.GoalNameParser;
import com.project.app.ai.service.impl.AiChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

public class AiGoalCalculatorServiceTest {

    private AiGoalCalculatorService calculatorService;
    private AmountParser amountParser;
    private DurationParser durationParser;
    private GoalNameParser goalNameParser;

    @BeforeEach
    public void setUp() {
        amountParser = new AmountParser();
        durationParser = new DurationParser();
        goalNameParser = new GoalNameParser();
        calculatorService = new AiGoalCalculatorService(amountParser, durationParser, goalNameParser);
    }

    @Test
    public void testTwoYearsGoal() {
        String prompt = "Tôi muốn mua ô tô 300 triệu trong 2 năm.";
        GoalContext ctx = calculatorService.calculate(prompt, Collections.emptyList(), BigDecimal.ZERO);

        assertNotNull(ctx);
        assertEquals("2 năm", ctx.getOriginalTimeText());
        assertEquals(24, ctx.getDurationMonths());
        assertFalse(ctx.isDays());
        assertEquals(300_000_000L, ctx.getTargetAmount());
        assertEquals(12_500_000L, ctx.getMonthlySavingWithoutBalance());
    }

    @Test
    public void testOneYearGoal() {
        String prompt = "Tôi muốn mua ô tô 300 triệu trong 1 năm.";
        GoalContext ctx = calculatorService.calculate(prompt, Collections.emptyList(), BigDecimal.ZERO);

        assertNotNull(ctx);
        assertEquals("1 năm", ctx.getOriginalTimeText());
        assertEquals(12, ctx.getDurationMonths());
        assertFalse(ctx.isDays());
        assertEquals(300_000_000L, ctx.getTargetAmount());
        assertEquals(25_000_000L, ctx.getMonthlySavingWithoutBalance());
    }

    @Test
    public void testFortyFiveDaysGoal() {
        String prompt = "Tôi muốn mua laptop 30 triệu trong 45 ngày.";
        GoalContext ctx = calculatorService.calculate(prompt, Collections.emptyList(), BigDecimal.ZERO);

        assertNotNull(ctx);
        assertEquals("45 ngày", ctx.getOriginalTimeText());
        assertEquals(45, ctx.getDurationDays());
        assertTrue(ctx.isDays());
        assertEquals(30_000_000L, ctx.getTargetAmount());
        assertEquals(666_667L, ctx.getDailySavingWithoutBalance());
    }

    @Test
    public void testNinetyDaysGoal() {
        String prompt = "Tôi muốn mua điện thoại 20 triệu trong 90 ngày.";
        GoalContext ctx = calculatorService.calculate(prompt, Collections.emptyList(), BigDecimal.ZERO);

        assertNotNull(ctx);
        assertEquals("90 ngày", ctx.getOriginalTimeText());
        assertEquals(90, ctx.getDurationDays());
        assertTrue(ctx.isDays());
        assertEquals(20_000_000L, ctx.getTargetAmount());
        assertEquals(222_223L, ctx.getDailySavingWithoutBalance());
    }

    @Test
    public void testOneYearSixMonthsGoal() {
        String prompt = "Tôi muốn mua xe máy 50 triệu trong 1 năm 6 tháng.";
        GoalContext ctx = calculatorService.calculate(prompt, Collections.emptyList(), BigDecimal.ZERO);

        assertNotNull(ctx);
        assertEquals("1 năm 6 tháng", ctx.getOriginalTimeText());
        assertEquals(18, ctx.getDurationMonths());
        assertFalse(ctx.isDays());
        assertEquals(50_000_000L, ctx.getTargetAmount());
        assertEquals(2_777_778L, ctx.getMonthlySavingWithoutBalance());
    }

    @Test
    public void testEndOfYearGoal() {
        String prompt = "Tôi muốn có 100 triệu vào cuối năm.";
        GoalContext ctx = calculatorService.calculate(prompt, Collections.emptyList(), BigDecimal.ZERO);

        assertNotNull(ctx);
        assertEquals("cuối năm", ctx.getOriginalTimeText());
        assertTrue(ctx.getDurationMonths() >= 1);
        assertFalse(ctx.isDays());
        assertEquals(100_000_000L, ctx.getTargetAmount());
    }
}
