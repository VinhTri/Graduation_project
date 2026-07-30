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
    private String id;
    private String text;
    private String moduleType; // RAG, ANALYTICS, RECOMMENDATION
    private String timestamp;
    private List<AiCardDto> cards;
    private AiActionPromptDto actionPrompt;
}
