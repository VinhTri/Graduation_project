package com.project.app.finance.controller;

import com.project.app.common.dto.ApiResponse;
import com.project.app.finance.service.AdminFinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFinanceController {
    private final AdminFinanceService service;

    @GetMapping("/wallets/{walletId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> walletDetail(@PathVariable Long walletId) {
        return ok("Lấy chi tiết ví thành công", service.walletDetail(walletId));
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reconciliation() {
        return ok("Đối soát sổ cái thành công", service.reconciliation());
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> ok(String message, Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true).message(message).data(data).build());
    }
}
