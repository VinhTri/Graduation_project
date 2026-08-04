package com.project.app.ai.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedDuration {
    private String originalTimeText;
    private int durationMonths;
    private int durationDays;
    private boolean isDays;
}
