package com.project.app.ai.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DurationInfo {
    private String originalText;
    private LocalDate targetDate;
    private Integer months;
    private Integer days;
    private DurationType type;

    @Builder.Default
    private DurationOperation operation = DurationOperation.SET;

    public enum DurationType {
        MONTHS, DAYS, RELATIVE_DATE, EXACT_DATE
    }

    public enum DurationOperation {
        SET, ADD, SUBTRACT
    }
}
