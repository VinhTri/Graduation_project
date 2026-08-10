package com.project.app.ai.controller;

import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.orchestration.AiChatService;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody AiChatRequest request) {

        AiChatResponse response = aiChatService.processChat(
                userDetails != null ? userDetails.getUser() : null,
                request
        );

        return ResponseEntity.ok(ApiResponse.<AiChatResponse>builder()
                .success(true)
                .message("Xử lý câu hỏi AI thành công")
                .data(response)
                .build());
    }
}
