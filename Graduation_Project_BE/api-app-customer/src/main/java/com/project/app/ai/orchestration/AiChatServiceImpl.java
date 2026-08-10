package com.project.app.ai.orchestration;

import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.guardrail.GuardrailService;
import com.project.app.ai.util.TextNormalizer;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final GuardrailService guardrailService;
    private final AiOrchestrator aiOrchestrator;
    private final AiResponseBuilderService responseBuilderService;

    @Override
    public AiChatResponse processChat(User user, AiChatRequest request) {
        String rawPrompt = (request != null && request.getMessage() != null) ? request.getMessage() : "";
        String userPrompt = TextNormalizer.normalizeWhitespace(rawPrompt);

        // 1. Resolve Conversation ID
        String conversationId = (request != null && request.getConversationId() != null && !request.getConversationId().trim().isEmpty())
                ? request.getConversationId().trim()
                : (user != null ? "user_" + user.getId() + "_default" : UUID.randomUUID().toString());

        // 2. Validate input via GuardrailService
        com.project.app.ai.guardrail.GuardrailResult guardrailResult = guardrailService.checkInput(user, userPrompt);
        if (!guardrailResult.isValid()) {
            log.warn("Request failed AI Guardrail validation for conversation [{}]: {}", conversationId, guardrailResult.getMessage());
            AiOrchestrator.OrchestratorResult blockedResult = AiOrchestrator.OrchestratorResult.builder()
                    .responseText(guardrailResult.getMessage())
                    .build();
            return responseBuilderService.buildResponse(conversationId, blockedResult);
        }

        log.info("Processing AI Chat Request for User [{}], ConvId [{}]", user != null ? user.getEmail() : "Guest", conversationId);

        // 3. Delegate to AiOrchestrator (Central Orchestrator)
        AiOrchestrator.OrchestratorResult result = aiOrchestrator.processRequest(user, conversationId, userPrompt);

        // 4. Delegate Response Building
        return responseBuilderService.buildResponse(conversationId, result);
    }
}
