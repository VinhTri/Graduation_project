package com.project.app.ai.dto.internal;

import com.project.app.ai.orchestration.IntentRouter.AiIntent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationState implements Serializable {
    private AiIntent lastIntent;

    // Financial Goal Context Inheritance
    private String goalName;
    private Long targetAmount;
    private Integer durationMonths;
    private String originalDurationText;
    private Long currentBalance;
    private Long emergencyFund;
    private Long customMonthlySaving;
    private Boolean useCurrentBalance;
}
