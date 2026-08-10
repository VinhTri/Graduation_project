package com.project.app.ai.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingPlan {
    private long initialAmount;
    private long remainingAmount;
    private long monthlySaving;
    private long dailySaving;
    private double monthsNeeded;
    private double daysNeeded;
}
