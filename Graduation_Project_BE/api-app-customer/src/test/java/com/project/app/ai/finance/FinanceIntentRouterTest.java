package com.project.app.ai.finance;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FinanceIntentRouterTest {

    private final FinanceIntentRouter router = new FinanceIntentRouter(new FinancePeriodParser());

    @Test
    void routesReportRequestsToDataInsteadOfGuide() {
        FinanceIntentRouter.FinanceRoute previousMonth = router.detect(
                "Cho tôi xem báo cáo thu chi của tháng trước.");
        FinanceIntentRouter.FinanceRoute currentMonth = router.detect(
                "Báo cáo thu chi tháng này của tôi thế nào?");

        assertThat(previousMonth.intent()).isEqualTo(FinanceIntent.PERIOD_OVERVIEW);
        assertThat(previousMonth.period().anchorDate()).isBefore(java.time.LocalDate.now().withDayOfMonth(1));
        assertThat(currentMonth.intent()).isEqualTo(FinanceIntent.PERIOD_OVERVIEW);
    }

    @Test
    void keepsActualHowToQuestionsOnGuideRoute() {
        assertThat(router.detect("Trung tâm tài chính là gì?").intent()).isEqualTo(FinanceIntent.GUIDE);
        assertThat(router.detect("Mở báo cáo thu chi ở đâu?").intent()).isEqualTo(FinanceIntent.GUIDE);
    }

    @Test
    void comparesIncomeAndExpenseInsideTheRequestedPeriod() {
        FinanceIntentRouter.FinanceRoute route = router.detect(
                "Tháng này tôi thu hay chi nhiều hơn? (Dòng tiền ròng)");

        assertThat(route.intent()).isEqualTo(FinanceIntent.PERIOD_NET);
        assertThat(route.period().period()).isEqualTo("MONTH");
    }

    @Test
    void prioritizesTotalAssetsOverNotebookPeriodFlow() {
        assertThat(router.detect("Tổng tài sản của tôi (Ví + Sổ tay tiền mặt) hiện tại là bao nhiêu?").intent())
                .isEqualTo(FinanceIntent.ASSETS_OVERVIEW);
        assertThat(router.detect("Cho biết tổng số dư ví và sổ tay của tôi").intent())
                .isEqualTo(FinanceIntent.ASSETS_OVERVIEW);
        assertThat(router.detect("Toàn bộ tài sản đang phân bổ ở ví và sổ tay ra sao?").intent())
                .isEqualTo(FinanceIntent.ASSETS_ALLOCATION);
    }

    @Test
    void keepsCurrentMonthAsPrimaryWhenComparingWithPreviousMonth() {
        FinanceIntentRouter.FinanceRoute route = router.detect(
                "Hãy so sánh tổng chi tiêu của tôi tháng này so với cùng kỳ tháng trước.");

        assertThat(route.intent()).isEqualTo(FinanceIntent.COMPARE_EXPENSE);
        assertThat(route.period().anchorDate().getMonth())
                .isEqualTo(java.time.LocalDate.now().getMonth());
        assertThat(route.period().anchorDate().getYear())
                .isEqualTo(java.time.LocalDate.now().getYear());
    }

    @Test
    void routesFlexibleFinancialHealthQuestionsToAssessment() {
        assertThat(router.detect("Đánh giá sức khỏe tài chính của tôi dựa trên dữ liệu thu chi tháng vừa qua.").intent())
                .isEqualTo(FinanceIntent.FINANCIAL_HEALTH);
        assertThat(router.detect("Tài chính tháng này của mình có khỏe không?").intent())
                .isEqualTo(FinanceIntent.FINANCIAL_HEALTH);
        assertThat(router.detect("Phân tích tài chính kỳ này giúp tôi").intent())
                .isEqualTo(FinanceIntent.FINANCIAL_HEALTH);
    }

    @Test
    void routesWasteAndAbnormalSpendingQuestionsToCategoryAnalysis() {
        assertThat(router.detect("Dựa vào chi tiêu tháng này, tôi đang lãng phí tiền vào khoản nào nhất?").intent())
                .isEqualTo(FinanceIntent.SPENDING_ANALYSIS);
        assertThat(router.detect("Có danh mục chi bất thường nào kỳ này không?").intent())
                .isEqualTo(FinanceIntent.SPENDING_ANALYSIS);
        assertThat(router.detect("Khoản nào tôi nên cắt bớt trong tháng?").intent())
                .isEqualTo(FinanceIntent.SPENDING_ANALYSIS);
    }
}
