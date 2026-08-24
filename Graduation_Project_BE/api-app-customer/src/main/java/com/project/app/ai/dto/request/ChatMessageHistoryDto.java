package com.project.app.ai.dto.request;

import lombok.Data;

@Data
public class ChatMessageHistoryDto {
    private String role;
    private String content;
}
