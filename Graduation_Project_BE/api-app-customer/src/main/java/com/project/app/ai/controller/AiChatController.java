package com.project.app.ai.controller;

import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.dto.response.HomeInsightResponse;
import com.project.app.ai.service.AiChatService;
import com.project.app.ai.service.AiInsightService;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final AiInsightService aiInsightService;

    @GetMapping("/home-insight")
    public ResponseEntity<ApiResponse<HomeInsightResponse>> homeInsight(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        HomeInsightResponse data = aiInsightService.getHomeInsight(
                userDetails != null ? userDetails.getUser() : null);

        return ResponseEntity.ok(ApiResponse.<HomeInsightResponse>builder()
                .success(true)
                .message("OK")
                .data(data)
                .build());
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody AiChatRequest request) {

        AiChatResponse data = aiChatService.chat(
                userDetails != null ? userDetails.getUser() : null,
                request);

        return ResponseEntity.ok(ApiResponse.<AiChatResponse>builder()
                .success(true)
                .message("OK")
                .data(data)
                .build());
    }
}
