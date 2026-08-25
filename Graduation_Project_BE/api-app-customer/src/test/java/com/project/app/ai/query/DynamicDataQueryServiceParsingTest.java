package com.project.app.ai.query;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DynamicDataQueryServiceParsingTest {

    @Test
    void extractsRequestedBudgetWithoutRequiringExistingCategory() {
        assertThat(DynamicDataQueryService.extractBudgetName(
                "Ngân sách \"Giải trí\" của tôi đã bị vượt hạn mức chưa?"))
                .isEqualTo("Giải trí");
        assertThat(DynamicDataQueryService.extractBudgetName(
                "Hạn mức ăn uống còn bao nhiêu?"))
                .isEqualTo("an uong");
    }

    @Test
    void distinguishesPersonalAndWholeFundContributions() {
        assertThat(DynamicDataQueryService.isCollectiveContributionQuery(
                "thang nay co nhung ai da dong gop tong cong bao nhieu vao quy du lich"))
                .isTrue();
        assertThat(DynamicDataQueryService.isCollectiveContributionQuery(
                "thang nay toi da dong gop bao nhieu vao quy du lich"))
                .isFalse();
        assertThat(DynamicDataQueryService.isCollectiveContributionQuery(
                "toi da dong gop tong cong bao nhieu vao quy"))
                .isFalse();
        assertThat(DynamicDataQueryService.isCollectiveContributionQuery(
                "quy nhan tong cong bao nhieu tien trong thang nay"))
                .isTrue();
    }

    @Test
    void extractsCategoryFromFlexibleExpenseQuestions() {
        assertThat(DynamicDataQueryService.extractExpenseCategoryName(
                "Chi phí \"Xăng xe\" của tôi trong 3 tháng gần nhất là bao nhiêu?"))
                .isEqualTo("Xăng xe");
        assertThat(DynamicDataQueryService.extractExpenseCategoryName(
                "Ba tháng qua tôi đã chi cho xăng xe hết bao nhiêu?"))
                .isEqualTo("xang xe");
        assertThat(DynamicDataQueryService.parseRecentMonthCount("chi phi xang xe trong 6 thang gan nhat"))
                .isEqualTo(6);
        assertThat(DynamicDataQueryService.extractExpenseCategoryName(
                "“3 tháng qua tôi tốn bao nhiêu tiền xăng?”"))
                .isEqualTo("xang");
        assertThat(DynamicDataQueryService.extractExpenseCategoryName(
                "Tuần này tôi tiêu bao nhiêu tiền cà phê?"))
                .isEqualTo("ca phe");
    }

    @Test
    void extractsMultipleCategoriesForOptimization() {
        assertThat(DynamicDataQueryService.extractQuotedNames(
                "Làm sao tối ưu khoản chi cho \"Di chuyển\" và \"Xăng xe\"?"))
                .containsExactly("Di chuyển", "Xăng xe");
    }

    @Test
    void recognizesDynamicBudgetAdviceWithoutFixedSentence() {
        assertThat(DynamicDataQueryService.isDynamicBudgetRequest(
                "thang nay co dam cuoi va sinh nhat toi nen dieu chinh ngan sach the nao"))
                .isTrue();
        assertThat(DynamicDataQueryService.isDynamicBudgetRequest(
                "co nhieu khoan phat sinh thi han muc nen sap xep ra sao"))
                .isTrue();
        assertThat(DynamicDataQueryService.isDynamicBudgetRequest("ngan sach an uong con bao nhieu"))
                .isFalse();
        assertThat(DynamicDataQueryService.isDynamicBudgetRequest(
                "thang nay co nhieu khoan chi phat sinh an uong toi nen dieu chinh ngan sach the nao"))
                .isTrue();
    }
}
