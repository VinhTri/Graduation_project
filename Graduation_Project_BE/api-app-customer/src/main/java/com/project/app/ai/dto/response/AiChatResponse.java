package com.project.app.ai.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiChatResponse {
    private String id;
    private String text;
    private String moduleType;
    private String timestamp;
    private List<AiCardDto> cards;
    private List<AiActionDto> actions;
}
