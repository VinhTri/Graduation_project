package com.project.app.ai.service;

import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.orchestration.AiOrchestrator;
import com.project.app.ai.orchestration.AiResponseBuilderService;
import com.project.app.user.entity.User;
import com.project.app.ai.entity.AiConversation;
import com.project.app.ai.entity.AiInteractionLog;
import com.project.app.ai.repository.AiInteractionLogRepository;
import com.project.app.ai.security.AiRateLimiter;
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
    private final AiConversationService conversationService;
    private final AiInteractionLogRepository interactionLogs;
    private final AiRateLimiter rateLimiter;

    @Override
    public AiChatResponse chat(User user, AiChatRequest request) {
        String message = request != null && request.getMessage() != null
                ? request.getMessage().trim()
                : "";

        if (message.isEmpty()) {
            return responseBuilder.build("Vui lòng nhập câu hỏi.", "GENERAL", null);
        }

        if (user == null) return responseBuilder.build("Vui lòng đăng nhập để sử dụng Trợ lý AI.", "GENERAL", null);
        rateLimiter.check(user.getId());
        long started = System.currentTimeMillis();
        AiConversation conversation = conversationService.resolve(user, request.getConversationId(), message);
        var history = request.getHistory() == null || request.getHistory().isEmpty()
                ? conversationService.history(conversation) : request.getHistory();
        try {
            AiOrchestrator.OrchestratorResult result = aiOrchestrator.process(
                    user,
                    message,
                    history);

            AiChatResponse response = responseBuilder.build(
                    result.getResponseText(),
                    result.getModuleType() != null ? result.getModuleType() : "GENERAL",
                    result.getToolResult(),
                    result.getCards(),
                    result.getActions());
            response.setConversationId(conversation.getPublicId());
            conversationService.append(conversation, "user", message, null);
            conversationService.append(conversation, "assistant", response.getText(), response.getModuleType());
            interactionLogs.save(AiInteractionLog.builder().userId(user.getId()).conversationId(conversation.getPublicId())
                    .moduleType(response.getModuleType()).toolName(result.getToolResult()!=null?result.getToolResult().getToolName():null)
                    .success(true).durationMs(System.currentTimeMillis()-started).build());
            return response;
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            interactionLogs.save(AiInteractionLog.builder().userId(user.getId()).conversationId(conversation.getPublicId())
                    .moduleType("GENERAL").success(false).durationMs(System.currentTimeMillis()-started)
                    .errorCode(e.getClass().getSimpleName()).build());
            AiChatResponse response = responseBuilder.build(
                    geminiClient.isConfigured() ? "Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau."
                            : "Tôi vẫn có thể phân tích tài chính, ngân sách và danh mục. Câu hỏi hướng dẫn tự do cần Gemini được cấu hình trên server.",
                    "GENERAL",
                    null);
            response.setConversationId(conversation.getPublicId());
            conversationService.append(conversation, "user", message, null);
            conversationService.append(conversation, "assistant", response.getText(), response.getModuleType());
            return response;
        }
    }
}
