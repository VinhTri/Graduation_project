package com.project.app.ai.advisory;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialMathAdvisoryServiceTest {

    private final FinancialMathAdvisoryService service = new FinancialMathAdvisoryService();

    @Test
    void calculatesRulesFromParametersInsteadOfFixedPrompts() {
        assertThat(text("Thu nhập 15 triệu, phân bổ giúp tôi theo 50/30/20"))
                .contains("7.500.000 ₫", "4.500.000 ₫", "3.000.000 ₫");
        assertThat(text("Lương 8tr thì chia quy tắc 50 / 30 / 20 ra sao?"))
                .contains("4.000.000 ₫", "2.400.000 ₫", "1.600.000 ₫");
        assertThat(text("Thu nhập tháng này của tôi là 20 triệu, hãy phân bổ"))
                .contains("10.000.000 ₫", "6.000.000 ₫", "4.000.000 ₫");
        assertThat(text("Lương 12tr thì nên chia ngân sách thế nào?"))
                .contains("6.000.000 ₫", "3.600.000 ₫", "2.400.000 ₫");
        assertThat(text("Tôi muốn mua iPhone 25 triệu sau 6 tháng, cần để dành mỗi tháng bao nhiêu?"))
                .contains("4.166.667 ₫");
        assertThat(text("Tôi muốn mua xe máy giá 25 triệu trong 1 năm tới, mỗi tháng cần tiết kiệm bao nhiêu?"))
                .contains("12 tháng", "2.083.334 ₫");
        assertThat(text("Mục tiêu 12 triệu trong nửa năm, hàng tháng để dành bao nhiêu?"))
                .contains("6 tháng", "2.000.000 ₫");
        assertThat(text("Tôi muốn mua xe đạp giá 25 triệu trong 20 ngày tới, mỗi tháng cần tiết kiệm bao nhiêu?"))
                .contains("20 ngày", "1.250.000 ₫/ngày", "8.750.000 ₫/tuần", "ngắn hơn một tháng");
        assertThat(text("Mua laptop 14 triệu sau 2 tuần, mỗi ngày phải để dành bao nhiêu?"))
                .contains("14 ngày", "1.000.000 ₫/ngày", "7.000.000 ₫/tuần");
        assertThat(text("Tôi muốn mua một chiếc xe máy 40 triệu trong 1 năm tới, hãy lập lộ trình tiết kiệm chi tiết giúp tôi."))
                .contains("12 tháng", "3.333.334 ₫/tháng", "tháng 3", "10.000.002 ₫", "tháng 6", "20.000.004 ₫")
                .doesNotContain("Tổng chi");
        assertThat(text("Còn 500k để dùng trong 10 ngày thì mỗi ngày nên tiêu bao nhiêu?"))
                .contains("50.000 ₫/ngày", "45.000 ₫/ngày");
        assertThat(text("Ngân sách ăn uống chỉ còn 50k cho 1 tháng cuối tháng, tôi nên tiêu xài thế nào?"))
                .contains("30 ngày", "1.666 ₫/ngày", "1.500 ₫/ngày");
        assertThat(text("Còn 700k cho 2 tuần, nên tiêu thế nào?"))
                .contains("14 ngày", "50.000 ₫/ngày", "45.000 ₫/ngày");
    }

    @Test
    void calculatesEmergencyFundRatiosAndSixJars() {
        assertThat(text("Lập quỹ khẩn cấp bằng 3 tháng lương, lương tôi 10 triệu"))
                .contains("30.000.000 ₫");
        assertThat(text("Chi giải trí 5 triệu trên thu nhập 12 triệu có cao không?"))
                .contains("41.7%", "khá cao");
        assertThat(text("Thu nhập 20 triệu chia theo 6 chiếc lọ thế nào?"))
                .contains("11.000.000 ₫", "2.000.000 ₫", "1.000.000 ₫");
        assertThat(text("Giải thích chi tiết cho tôi quy tắc quản lý tài chính 6 chiếc lọ."))
                .contains("55%", "tự do tài chính", "giáo dục", "5% cho đi");
        assertThat(text("Giải thích quy tắc quản lý tài chính 4 lọ"))
                .contains("Không có quy tắc tài chính chuẩn", "3 lọ còn lại", "15%/lọ");
        assertThat(text("Giải thích quy tắc quản lý tài chính 5 chiếc lọ"))
                .contains("tổng cộng 45%", "11.25%/lọ", "tổng luôn đúng 100%")
                .doesNotContain("11.3%/lọ");
        assertThat(text("Tôi có 20 triệu và muốn chia thành 10 chiếc lọ"))
                .contains("10 chiếc lọ", "11.000.000 ₫", "1.000.000 ₫", "5%/lọ");
        assertThat(service.advise(null, "Giải thích mô hình 5 lọ").orElseThrow().actions())
                .isEmpty();
        assertThat(text("Tôi đang dư 20 triệu trong ví, gợi ý quản lý số tiền này tốt hơn"))
                .contains("10.000.000 ₫", "6.000.000 ₫", "4.000.000 ₫", "quỹ khẩn cấp");
        assertThat(service.advise(null, "Còn dư trong ví 8tr, tôi nên làm gì?").orElseThrow().actions().get(0).getId())
                .isEqualTo("create_saving_fund");
    }

    private String text(String prompt) {
        return service.advise(null, prompt).orElseThrow().text();
    }
}
