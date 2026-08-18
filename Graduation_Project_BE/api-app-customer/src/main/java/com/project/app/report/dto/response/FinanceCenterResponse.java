package com.project.app.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceCenterResponse {
    private String period;
    private String currentLabel;
    private String compareLabel;
    private LocalDate currentDate;
    private LocalDate compareDate;

    private BigDecimal walletBalance;
    private BigDecimal cashBalance;
    private BigDecimal totalAssets;
    private Double walletBalancePercent;
    private Double cashBalancePercent;

    private PeriodSnapshot current;
    private PeriodSnapshot compare;
    private PeriodDelta delta;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodSnapshot {
        private SourceFlow wallet;
        private SourceFlow cash;
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal net;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceFlow {
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal net;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodDelta {
        private SourceDelta wallet;
        private SourceDelta cash;
        private AmountDelta totalIncome;
        private AmountDelta totalExpense;
        private AmountDelta net;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceDelta {
        private AmountDelta income;
        private AmountDelta expense;
        private AmountDelta net;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmountDelta {
        private BigDecimal amount;
        private Double percent;
    }
}
