package com.project.app.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {

    private Long conversationId;

    @NotBlank(message = "Message content cannot be blank")
    private String message;

    @Builder.Default
    private boolean stream = false;

    @Builder.Default
    private String mode = "AUTO"; // "AUTO", "SUPPORT", "ADVICE", "PREDICT"
}
