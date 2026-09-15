package com.project.app.ai.service;

import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.user.entity.User;

public interface AiChatService {
    AiChatResponse chat(User user, AiChatRequest request);
}
