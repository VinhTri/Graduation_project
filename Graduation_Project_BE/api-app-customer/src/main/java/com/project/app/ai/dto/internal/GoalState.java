package com.project.app.ai.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class GoalState {
    private String goalName;
    private long targetAmount;
    private int durationMonths;
    private int durationDays;
    private boolean isDays;
    private String originalTimeText;
    private long declaredBalance;
    private long emergencyFund;
    private long monthlySaving;
    private long customMonthlySaving;
    private boolean keepEntireBalance;

    public long getMonthlySaving() {
        return monthlySaving > 0 ? monthlySaving : customMonthlySaving;
    }

    public void setMonthlySaving(long val) {
        this.monthlySaving = val;
        this.customMonthlySaving = val;
    }
}
