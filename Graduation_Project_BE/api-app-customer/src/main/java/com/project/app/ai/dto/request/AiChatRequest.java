package com.project.app.ai.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class AiChatRequest {
    private String conversationId;
    private String message;
    private List<ChatMessageHistoryDto> history;
}
