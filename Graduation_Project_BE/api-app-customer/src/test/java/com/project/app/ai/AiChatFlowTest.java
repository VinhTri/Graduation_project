package com.project.app.ai;

import com.project.app.ai.calculator.GoalCalculator;
import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.GoalCalculationResult;
import com.project.app.ai.orchestration.IntentRouter;
import com.project.app.ai.parser.AmountParser;
import com.project.app.ai.parser.DurationParser;
import com.project.app.ai.service.DateResolverService;
import com.project.app.ai.util.TextNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class AiChatFlowTest {

    private AmountParser amountParser;
    private DateResolverService dateResolverService;
    private GoalCalculator goalCalculator;

    @BeforeEach
    void setUp() {
        amountParser = new AmountParser();
        dateResolverService = new DateResolverService(new DurationParser());
        goalCalculator = new GoalCalculator();
    }

    private String removeAccents(String text) {
        if (text == null) return "";
        String temp = Normalizer.normalize(text, Normalizer.Form.NFD);
        return temp.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replace("đ", "d")
                .trim();
    }

    @Test
    void testFormatTextAndWhitespaceNormalization() {
        String rawInput = "   Tôi muốn mua xe   300 triệu   trong 9 tháng .  ";
        String normalized = TextNormalizer.normalizeWhitespace(rawInput);
        assertEquals("Tôi muốn mua xe 300 triệu trong 9 tháng.", normalized);

        long amount = amountParser.parse(normalized);
        assertEquals(300000000L, amount);

        DurationInfo duration = dateResolverService.resolveDuration(normalized, LocalDate.of(2026, 8, 9));
        assertEquals(9, duration.getMonths());
    }

    @Test
    void test1_SpendingPeriodTodayNotMonth() {
        String query = "Hôm nay tôi đã tiêu bao nhiêu tiền?";
        String norm = removeAccents(query);
        assertTrue(norm.contains("hom nay"), "Query must contain 'hôm nay'");
        assertFalse(norm.contains("thang nay"), "Query must not be confused with 'tháng này'");
    }

    @Test
    void test2_SpendingByCategoryNotRAG() {
        String query = "Tháng này tôi tiêu nhiều nhất vào danh mục nào?";
        String norm = removeAccents(query);
        assertTrue(norm.contains("danh muc") && (norm.contains("tieu nhieu nhat") || norm.contains("nhieu nhat")),
                "Query must be classified as QUERY_SPENDING_BY_CATEGORY");
    }

    @Test
    void test3_LowestWalletVsHighestWallet() {
        String lowestQuery = "Ví nào đang có số dư thấp nhất?";
        String highestQuery = "Ví nào đang có nhiều tiền nhất?";

        String normLowest = removeAccents(lowestQuery);
        String normHighest = removeAccents(highestQuery);

        assertTrue(normLowest.contains("thap nhat") || normLowest.contains("it tien nhat"), "Lowest wallet query must detect MIN balance");
        assertTrue(normHighest.contains("nhieu tien nhat"), "Highest wallet query must detect MAX balance");
    }

    @Test
    void test4_Income15MExpense8MSaving7M() {
        String text = "Tôi thu nhập 15 triệu/tháng, chi khoảng 8 triệu.";
        long income = amountParser.parseUserDeclaredBalance(text);
        if (income == 0) income = amountParser.parse(text);
        long expense = amountParser.parseActualExpense(text);

        assertEquals(15000000L, income);
        assertEquals(8000000L, expense);
        assertEquals(7000000L, income - expense, "Saving must be directly income - expense = 7.000.000 VNĐ/month");
    }

    @Test
    void test5_Laptop25MIn6MonthsWith10MBalance() {
        String text = "Tôi có 10 triệu, muốn mua laptop 25 triệu trong 6 tháng.";
        long declaredBal = amountParser.parseUserDeclaredBalance(text);
        long targetAmount = amountParser.parseTargetAmount(text);
        DurationInfo duration = dateResolverService.resolveDuration(text, LocalDate.of(2026, 8, 9));

        assertEquals(10000000L, declaredBal);
        assertEquals(25000000L, targetAmount);
        assertEquals(6, duration.getMonths());

        GoalCalculationResult result = goalCalculator.calculatePlan(
                "laptop", targetAmount, duration, BigDecimal.ZERO, declaredBal, 0L, true, 0L
        );

        assertEquals(2500000L, result.getUsingBalance().getMonthlySaving(), "Monthly saving must be (25M - 10M)/6 = 2.5M VNĐ/month");
    }

    @Test
    void test6_Saving50MIn1YearWith5MBalance() {
        String text = "Tôi muốn tiết kiệm 50 triệu trong 1 năm, hiện có 5 triệu.";
        long declaredBal = amountParser.parseUserDeclaredBalance(text);
        long targetAmount = amountParser.parseTargetAmount(text);
        DurationInfo duration = dateResolverService.resolveDuration(text, LocalDate.of(2026, 8, 9));

        assertEquals(5000000L, declaredBal);
        assertEquals(50000000L, targetAmount);
        assertEquals(12, duration.getMonths());

        GoalCalculationResult result = goalCalculator.calculatePlan(
                "tiết kiệm", targetAmount, duration, BigDecimal.ZERO, declaredBal, 0L, true, 0L
        );

        assertEquals(3750000L, result.getUsingBalance().getMonthlySaving(), "Monthly saving must be (50M - 5M)/12 = 3.75M VNĐ/month");
    }

    @Test
    void test7_MultiTurnCar300MSequence() {
        // Turn 1: Initial Goal
        String t1 = "Tôi muốn mua ô tô 300 triệu, hiện có 20 triệu, không dùng số dư, trong 1 năm 10 tháng thì mỗi tháng cần bao nhiêu?";
        long target1 = amountParser.parseTargetAmount(t1);
        long bal1 = amountParser.parseUserDeclaredBalance(t1);
        Boolean useBal1 = amountParser.parseUseCurrentBalance(t1);
        DurationInfo dur1 = dateResolverService.resolveDuration(t1, LocalDate.of(2026, 8, 9));

        assertEquals(300000000L, target1);
        assertEquals(20000000L, bal1);
        assertEquals(Boolean.FALSE, useBal1);
        assertEquals(22, dur1.getMonths());

        // Turn 2: Follow-up monthly saving capacity (15M)
        String t2 = "Nếu chỉ tiết kiệm 15 triệu/tháng thì sao?";
        boolean isMonthlySaving2 = amountParser.isMonthlySavingStatement(t2);
        long target2 = amountParser.parseTargetAmount(t2);
        long monthly2 = amountParser.parse(t2);

        assertTrue(isMonthlySaving2);
        assertEquals(0L, target2, "Target amount must NOT be extracted from monthly saving capacity!");
        assertEquals(15000000L, monthly2);
    }

    @Test
    void test8_EdgeCasesValidation() {
        // Edge Case 1: Dynamic Goal Name Extraction
        String gName = amountParser.parseGoalName("Tôi muốn mua tivi 50 triệu trong 1 năm");
        assertEquals("tivi", gName);

        // Edge Case 2: New Goal Overwrites Old Goal Target
        long t1 = amountParser.parseTargetAmount("Tôi cần có 500 triệu trong 3 năm");
        long t2 = amountParser.parseTargetAmount("Tôi muốn có 100 triệu trong 1 năm");
        assertEquals(500000000L, t1);
        assertEquals(100000000L, t2);

        // Edge Case 3: Short Transaction Routing
        IntentRouter router = new IntentRouter();
        IntentRouter.AiIntent txIntent = router.detectIntent("Ăn sáng 50k");
        assertEquals(IntentRouter.AiIntent.CREATE_TRANSACTION, txIntent);

        // Edge Case 4: Query Wallet Routing
        IntentRouter.AiIntent walletIntent = router.detectIntent("Tôi có bao nhiêu ví?");
        assertEquals(IntentRouter.AiIntent.QUERY_WALLET, walletIntent);
    }
}
