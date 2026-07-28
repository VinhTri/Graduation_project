package com.project.app.ai.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.request.FeedbackRequest;
import com.project.app.ai.dto.request.IngestDocumentRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.dto.response.HistoryResponse;
import com.project.app.ai.service.AiService;
import com.project.app.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiChatRequest request) {
        
        AiChatResponse response = aiService.chat(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<AiChatResponse>builder()
                .success(true)
                .message("Phản hồi từ AI Assistant thành công")
                .data(response)
                .build());
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<HistoryResponse>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<HistoryResponse> history = aiService.getConversationHistory(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<HistoryResponse>>builder()
                .success(true)
                .message("Lấy lịch sử hội thoại thành công")
                .data(history)
                .build());
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<ApiResponse<List<AiChatResponse>>> getMessages(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        List<AiChatResponse> messages = aiService.getConversationMessages(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<List<AiChatResponse>>builder()
                .success(true)
                .message("Lấy danh sách tin nhắn thành công")
                .data(messages)
                .build());
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        aiService.deleteConversation(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa hội thoại thành công")
                .build());
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Void>> feedback(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FeedbackRequest request) {
        
        aiService.submitFeedback(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Gửi phản hồi đánh giá thành công")
                .build());
    }

    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<Void>> ingestDocument(
            @Valid @RequestBody IngestDocumentRequest request) {
        
        aiService.ingestDocument(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Tài liệu hướng dẫn đã được index thành công")
                .build());
    }
}
