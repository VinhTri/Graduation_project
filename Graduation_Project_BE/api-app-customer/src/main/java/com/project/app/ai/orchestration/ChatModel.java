package com.project.app.ai.orchestration;

import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.client.dto.GeminiResponseDto;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.tool.dto.ToolCallDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatModel {

    private final GeminiClient geminiClient;

    public GeminiResponseDto call(String systemPrompt, String userPrompt, List<ChatMessageHistoryDto> history, List<Map<String, Object>> tools) throws Exception {
        return geminiClient.callGeminiApiWithTools(systemPrompt, userPrompt, history, tools);
    }

    public String sendToolResult(String systemPrompt, String userPrompt, List<ChatMessageHistoryDto> history, ToolCallDto toolCall, ToolResultDto toolResult) throws Exception {
        return geminiClient.sendToolResultToGemini(systemPrompt, userPrompt, history, toolCall, toolResult);
    }

    public String sendToolResults(String systemPrompt, String userPrompt, List<ChatMessageHistoryDto> history, List<ToolCallDto> toolCalls, List<ToolResultDto> toolResults) throws Exception {
        return geminiClient.sendToolResultsToGemini(systemPrompt, userPrompt, history, toolCalls, toolResults);
    }
}
