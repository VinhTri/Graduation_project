package com.project.app.transaction.controller.admin;

import com.project.app.common.dto.ApiResponse;
import com.project.app.transaction.dto.response.AdminTransactionResponse;
import com.project.app.transaction.service.admin.AdminTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final AdminTransactionService adminTransactionService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminTransactionResponse>>> getAllTransactions() {
        List<AdminTransactionResponse> data = adminTransactionService.getAllTransactions();
        return ResponseEntity.ok(ApiResponse.<List<AdminTransactionResponse>>builder()
                .success(true)
                .message("Lấy lịch sử giao dịch hệ thống thành công")
                .data(data)
                .build());
    }
}
