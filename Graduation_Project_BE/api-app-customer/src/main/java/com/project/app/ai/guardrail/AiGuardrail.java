package com.project.app.ai.guardrail;

import com.project.app.user.entity.User;

public interface AiGuardrail {

    boolean validateInput(User user, String userPrompt);

    GuardrailResult checkInput(User user, String userPrompt);
}
