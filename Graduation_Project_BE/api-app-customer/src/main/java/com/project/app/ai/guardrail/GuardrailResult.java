package com.project.app.ai.guardrail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardrailResult {
    private boolean valid;
    private String message;
    private GuardrailType violationType;

    public static GuardrailResult ok() {
        return GuardrailResult.builder()
                .valid(true)
                .message("Input passed guardrail checks")
                .build();
    }

    public static GuardrailResult fail(GuardrailType type, String message) {
        return GuardrailResult.builder()
                .valid(false)
                .violationType(type)
                .message(message)
                .build();
    }

    public enum GuardrailType {
        EMPTY_INPUT,
        EXCEEDS_MAX_LENGTH,
        PROMPT_INJECTION,
        UNSUPPORTED_REQUEST,
        SENSITIVE_DATA_LEAK
    }
}
