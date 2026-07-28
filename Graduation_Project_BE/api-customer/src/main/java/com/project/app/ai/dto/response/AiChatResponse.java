package com.project.app.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {

    private Long conversationId;
    private Long messageId;
    private String sender; // "AI"
    private String content; // text content (markdown)
    private StructuredData structuredData;
    private List<CitationDto> citations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StructuredData {
        private Overview overview;
        private List<String> analysis;
        private List<String> warnings;
        private List<String> suggestions;
        private List<String> nextActions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Overview {
        private String status; // "SAFE", "WARNING", "DANGER"
        private double currentSpent;
        private double income;
        private int daysRemaining;
        private double predictedTotal;
    }
}
