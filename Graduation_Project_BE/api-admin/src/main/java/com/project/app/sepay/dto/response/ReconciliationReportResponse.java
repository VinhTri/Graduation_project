package com.project.app.sepay.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReconciliationReportResponse {
    private LocalDateTime runAt;
    private long totalSePayRecords;
    private long matchedCount;
    private long unmatchedCount;
    private long amountMismatchCount;
    private long ignoredCount;
    private long orphanInternalCount;
    private BigDecimal unmatchedAmountTotal;
    private BigDecimal mismatchAmountDelta;
    private List<ReconciliationItemResponse> issues;
}
