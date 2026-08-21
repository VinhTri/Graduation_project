package com.project.app.ai.service;

import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.orchestration.AiOrchestrator;
import com.project.app.ai.orchestration.AiResponseBuilderService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final GeminiClient geminiClient;
    private final AiOrchestrator aiOrchestrator;
    private final AiResponseBuilderService responseBuilder;

    @Override
    public AiChatResponse chat(User user, AiChatRequest request) {
        String message = request != null && request.getMessage() != null
                ? request.getMessage().trim()
                : "";

        if (message.isEmpty()) {
            return responseBuilder.build("Vui lòng nhập câu hỏi.", "GENERAL", null);
        }

        if (!geminiClient.isConfigured()) {
            log.warn("Gemini API key chưa cấu hình");
            return responseBuilder.build(
                    "Trợ lý AI chưa sẵn sàng. Vui lòng cấu hình GEMINI_API_KEY trên server.",
                    "GENERAL",
                    null);
        }

        try {
            AiOrchestrator.OrchestratorResult result = aiOrchestrator.process(
                    user,
                    message,
                    request.getHistory());

            return responseBuilder.build(
                    result.getResponseText(),
                    result.getModuleType() != null ? result.getModuleType() : "GENERAL",
                    result.getToolResult(),
                    result.getCards(),
                    result.getActions());
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            return responseBuilder.build(
                    "Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau.",
                    "GENERAL",
                    null);
        }
    }
}
