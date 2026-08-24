package com.project.app.ai.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

import java.util.List;

@Data
public class AiChatRequest {
    @Size(max = 64, message = "Mã hội thoại không hợp lệ")
    private String conversationId;
    @NotBlank(message = "Vui lòng nhập câu hỏi")
    @Size(max = 1000, message = "Câu hỏi tối đa 1.000 ký tự")
    private String message;
    @Size(max = 20, message = "Chỉ gửi tối đa 20 tin nhắn lịch sử")
    @Valid
    private List<ChatMessageHistoryDto> history;
}
