package com.project.app.ai.controller;

import com.project.app.ai.service.RagIngestionService;
import com.project.app.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class AdminRagController {

    private final RagIngestionService ragIngestionService;

    @PostMapping({"/admin/ai/rag/reindex", "/api/v1/admin/ai/rag/reindex"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> reindexRag() {
        Map<String, Object> result = ragIngestionService.reindexAllDocuments();

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Tiến trình reindex RAG tri thức ứng dụng đã hoàn tất")
                .data(result)
                .build());
    }
}
