package com.project.app.ai.finance;

import java.time.LocalDate;

public record ResolvedPeriod(
        String period,
        LocalDate anchorDate,
        LocalDate compareDate
) {
    public static ResolvedPeriod defaults() {
        return new ResolvedPeriod("MONTH", LocalDate.now(), null);
    }
}
