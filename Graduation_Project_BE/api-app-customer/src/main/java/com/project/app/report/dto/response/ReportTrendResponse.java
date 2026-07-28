package com.project.app.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTrendResponse {
    private String label; // "T1", "T2", or "Tuần 1", etc.
    private BigDecimal value;
    private boolean isCurrent; // true if this is the current time segment (e.g. "Tháng này")
}
