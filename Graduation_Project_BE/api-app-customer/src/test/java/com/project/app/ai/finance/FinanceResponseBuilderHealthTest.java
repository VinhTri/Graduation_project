package com.project.app.ai.finance;

import com.project.app.ai.tool.dto.ToolResultDto;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FinanceResponseBuilderHealthTest {

    private final FinanceResponseBuilder builder = new FinanceResponseBuilder();

    @Test
    void assessesRatiosAndProvidesAdviceInsteadOfOnlyRepeatingTotals() {
        ToolResultDto result = ToolResultDto.builder().success(true).data(Map.of(
                "currentLabel", "Tháng 8/2026",
                "current", Map.of("totalIncome", 5_050_000d, "totalExpense", 1_100_000d, "net", 3_950_000d)
        )).build();

        assertThat(builder.buildText(FinanceIntent.FINANCIAL_HEALTH, result))
                .contains("mức tốt", "21,8% thu nhập", "tỷ lệ để dành 78,2%", "quỹ khẩn cấp")
                .contains("một kỳ");
    }

    @Test
    void identifiesReviewCandidateWithoutCallingItWasteAsFact() {
        ToolResultDto result = ToolResultDto.builder().success(true).data(Map.of(
                "currentLabel", "Tháng 8/2026",
                "currentTop", List.of(
                        Map.of("categoryName", "Ăn uống", "totalAmount", 1_000_000d, "percentage", 90.9d),
                        Map.of("categoryName", "Giải trí", "totalAmount", 100_000d, "percentage", 9.1d))
        )).build();

        assertThat(builder.buildText(FinanceIntent.SPENDING_ANALYSIS, result))
                .contains("nên rà soát trước", "Ăn uống", "1,000,000 đ", "90,9%", "chưa đủ để kết luận là lãng phí");
    }
}
