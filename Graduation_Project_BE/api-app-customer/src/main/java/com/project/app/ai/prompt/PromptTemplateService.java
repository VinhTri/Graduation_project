package com.project.app.ai.prompt;

import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PromptTemplateService {

    private final SystemPrompt systemPrompt;

    public String buildPrompt(User user) {
        return systemPrompt.getSystemInstruction(user);
    }
}
