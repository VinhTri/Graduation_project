package com.project.app.ai.orchestration;

import com.project.app.ai.client.dto.GeminiResponseDto;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.tool.dto.ToolCallDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class ChatClient {

    private final ChatModel chatModel;

    public static Builder builder(ChatModel chatModel) {
        return new Builder(chatModel);
    }

    public PromptRequest prompt() {
        return new PromptRequest(chatModel);
    }

    public static class Builder {
        private final ChatModel chatModel;

        public Builder(ChatModel chatModel) {
            this.chatModel = chatModel;
        }

        public ChatClient build() {
            return new ChatClient(chatModel);
        }
    }

    public static class PromptRequest {
        private final ChatModel chatModel;
        private String systemPrompt = "";
        private String userPrompt = "";
        private List<ChatMessageHistoryDto> history = new ArrayList<>();
        private List<Map<String, Object>> tools = new ArrayList<>();

        public PromptRequest(ChatModel chatModel) {
            this.chatModel = chatModel;
        }

        public PromptRequest system(String systemPrompt) {
            this.systemPrompt = systemPrompt;
            return this;
        }

        public PromptRequest user(String userPrompt) {
            this.userPrompt = userPrompt;
            return this;
        }

        public PromptRequest history(List<ChatMessageHistoryDto> history) {
            if (history != null) {
                this.history = history;
            }
            return this;
        }

        public PromptRequest tools(List<Map<String, Object>> tools) {
            if (tools != null) {
                this.tools = tools;
            }
            return this;
        }

        public GeminiResponseDto call() throws Exception {
            return chatModel.call(systemPrompt, userPrompt, history, tools);
        }

        public String sendToolResult(ToolCallDto toolCall, ToolResultDto toolResult) throws Exception {
            return chatModel.sendToolResult(systemPrompt, userPrompt, history, toolCall, toolResult);
        }

        public String sendToolResults(List<ToolCallDto> toolCalls, List<ToolResultDto> toolResults) throws Exception {
            return chatModel.sendToolResults(systemPrompt, userPrompt, history, toolCalls, toolResults);
        }
    }
}
