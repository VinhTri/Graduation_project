package com.project.app.ai.prompt;

import com.project.app.ai.dto.gemini.GeminiRequest;
import com.project.app.ai.entity.AiConversation;
import com.project.app.ai.entity.AiMessage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class PromptBuilder {

    public GeminiRequest buildChatRequest(
            AiConversation conversation,
            String currentMessage,
            String mode,
            String injectedContext) {

        List<GeminiRequest.Content> contents = new ArrayList<>();
        List<GeminiRequest.Content> rawHistory = new ArrayList<>();

        // Add history messages
        if (conversation.getMessages() != null) {
            List<AiMessage> historyList = conversation.getMessages();
            int size = historyList.size();
            for (int i = 0; i < size; i++) {
                AiMessage msg = historyList.get(i);
                // If it is the last message and it's a USER message (which is the current prompt), skip it
                // because it will be appended below as the current compiled user prompt.
                if (i == size - 1 && "USER".equals(msg.getSender())) {
                    continue;
                }
                
                if (msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                    String role = "USER".equals(msg.getSender()) ? "user" : "model";
                    rawHistory.add(GeminiRequest.Content.builder()
                            .role(role)
                            .parts(List.of(GeminiRequest.Part.builder().text(msg.getContent()).build()))
                            .build());
                }
            }
        }

        // Merge consecutive messages with the same role to prevent Gemini 400 Bad Request error
        GeminiRequest.Content currentContent = null;
        for (GeminiRequest.Content c : rawHistory) {
            if (currentContent == null) {
                currentContent = c;
            } else if (currentContent.getRole().equals(c.getRole())) {
                String mergedText = currentContent.getParts().get(0).getText() + "\n" + c.getParts().get(0).getText();
                currentContent = GeminiRequest.Content.builder()
                        .role(currentContent.getRole())
                        .parts(List.of(GeminiRequest.Part.builder().text(mergedText).build()))
                        .build();
            } else {
                contents.add(currentContent);
                currentContent = c;
            }
        }
        if (currentContent != null) {
            contents.add(currentContent);
        }

        // Determine user prompt based on mode and injected context
        String compiledUserText = currentMessage;
        if ("SUPPORT".equalsIgnoreCase(mode)) {
            if (injectedContext != null && !injectedContext.trim().isEmpty()) {
                compiledUserText = String.format(PromptTemplates.SUPPORT_PROMPT, injectedContext) 
                        + "\n\nUser Question: " + currentMessage;
            }
        } else if ("ADVICE".equalsIgnoreCase(mode)) {
            compiledUserText = PromptTemplates.ADVISOR_PROMPT 
                    + "\n\nUser Question: " + currentMessage;
        } else if ("PREDICT".equalsIgnoreCase(mode)) {
            compiledUserText = PromptTemplates.PREDICTION_PROMPT 
                    + "\n\nUser Question: " + currentMessage;
        }

        // Add the current user prompt (merge if last history element is also 'user')
        if (!contents.isEmpty() && "user".equals(contents.get(contents.size() - 1).getRole())) {
            int lastIdx = contents.size() - 1;
            GeminiRequest.Content lastUserContent = contents.get(lastIdx);
            String mergedText = lastUserContent.getParts().get(0).getText() + "\n" + compiledUserText;
            contents.set(lastIdx, GeminiRequest.Content.builder()
                    .role("user")
                    .parts(List.of(GeminiRequest.Part.builder().text(mergedText).build()))
                    .build());
        } else {
            contents.add(GeminiRequest.Content.builder()
                    .role("user")
                    .parts(List.of(GeminiRequest.Part.builder().text(compiledUserText).build()))
                    .build());
        }

        // Build system instructions (System Prompt + Safety Guidelines)
        String fullSystemInstructions = String.format("Current Date: %s\n\n", java.time.LocalDate.now().toString()) 
                + PromptTemplates.SYSTEM_PROMPT + "\n\n" + PromptTemplates.SAFETY_PROMPT;
        GeminiRequest.Content systemInstruction = GeminiRequest.Content.builder()
                .role("system")
                .parts(List.of(GeminiRequest.Part.builder().text(fullSystemInstructions).build()))
                .build();

        // Build Tools for Function Calling (Except for SUPPORT mode to optimize performance)
        List<GeminiRequest.Tool> tools = null;
        if (!"SUPPORT".equalsIgnoreCase(mode)) {
            tools = buildToolsList();
        }

        // Setup Generation Configuration (JSON structure constraint)
        // Note: Gemini does not support responseMimeType="application/json" when Function Calling (tools) is active.
        GeminiRequest.GenerationConfig generationConfig = GeminiRequest.GenerationConfig.builder()
                .temperature(getTemperatureForMode(mode))
                .responseMimeType(tools == null || tools.isEmpty() ? "application/json" : null)
                .build();

        return GeminiRequest.builder()
                .contents(contents)
                .systemInstruction(systemInstruction)
                .generationConfig(generationConfig)
                .tools(tools)
                .build();
    }

    private Double getTemperatureForMode(String mode) {
        if (mode == null) return 0.2;
        switch (mode.toUpperCase()) {
            case "SUPPORT": return 0.1;   // Support QA needs strict adherence to RAG docs
            case "PREDICT": return 0.1;   // Predictions require high accuracy, no hallucination
            case "ADVICE": return 0.4;    // Advice can allow subtle style flexibility
            default: return 0.2;
        }
    }

    private List<GeminiRequest.Tool> buildToolsList() {
        // Declare getMonthlyStatistics
        GeminiRequest.FunctionDeclaration getMonthlyStats = GeminiRequest.FunctionDeclaration.builder()
                .name("getMonthlyStatistics")
                .description("Lấy báo cáo tổng quan thu nhập, chi tiêu chi tiết của người dùng trong tháng và năm chỉ định.")
                .parameters(GeminiRequest.ParameterSchema.builder()
                        .type("OBJECT")
                        .properties(Map.of(
                                "month", GeminiRequest.PropertyDetail.builder().type("INTEGER").description("Tháng cần lấy thống kê (1-12)").build(),
                                "year", GeminiRequest.PropertyDetail.builder().type("INTEGER").description("Năm cần lấy thống kê").build()
                        ))
                        .required(List.of("month", "year"))
                        .build())
                .build();

        // Declare getTransactions
        GeminiRequest.FunctionDeclaration getTransactions = GeminiRequest.FunctionDeclaration.builder()
                .name("getTransactions")
                .description("Lấy danh sách các giao dịch phát sinh gần đây của người dùng để phân tích thói quen mua sắm.")
                .parameters(GeminiRequest.ParameterSchema.builder()
                        .type("OBJECT")
                        .properties(Map.of(
                                "limit", GeminiRequest.PropertyDetail.builder().type("INTEGER").description("Số lượng giao dịch tối đa (mặc định 20)").build()
                        ))
                        .build())
                .build();

        // Declare getBudgets
        GeminiRequest.FunctionDeclaration getBudgets = GeminiRequest.FunctionDeclaration.builder()
                .name("getBudgets")
                .description("Lấy danh sách ngân sách chi tiêu hiện có của người dùng kèm tiến độ tiêu dùng.")
                .parameters(GeminiRequest.ParameterSchema.builder()
                        .type("OBJECT")
                        .properties(Map.of())
                        .build())
                .build();

        // Declare getExpenseTrend
        GeminiRequest.FunctionDeclaration getExpenseTrend = GeminiRequest.FunctionDeclaration.builder()
                .name("getExpenseTrend")
                .description("Lấy xu hướng biến động chi tiêu tổng hợp trong các tháng gần đây để làm dữ liệu dự đoán cuối tháng.")
                .parameters(GeminiRequest.ParameterSchema.builder()
                        .type("OBJECT")
                        .properties(Map.of(
                                "monthsCount", GeminiRequest.PropertyDetail.builder().type("INTEGER").description("Số lượng tháng lịch sử (ví dụ: 6)").build()
                        ))
                        .required(List.of("monthsCount"))
                        .build())
                .build();

        return List.of(GeminiRequest.Tool.builder()
                .functionDeclarations(List.of(getMonthlyStats, getTransactions, getBudgets, getExpenseTrend))
                .build());
    }
}
