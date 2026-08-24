package com.project.app.audit.controller;

import com.project.app.audit.service.AdminAuditService;
import com.project.app.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {
    private final AdminAuditService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecent() {
        return ResponseEntity.ok(ApiResponse.<List<Map<String, Object>>>builder()
                .success(true).message("Lấy nhật ký quản trị thành công").data(service.recent()).build());
    }
}
