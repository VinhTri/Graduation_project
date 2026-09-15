package com.project.app.ai.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class ChatMessageHistoryDto {
    @Size(max = 20)
    private String role;
    @Size(max = 2000)
    private String content;
}
