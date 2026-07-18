package com.project.app.history.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.history.dto.response.TransactionHistoryResponse;
import com.project.app.history.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<TransactionHistoryResponse>>> getTransactionHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(value = "wallet", required = false, defaultValue = "main") String wallet) {

        List<TransactionHistoryResponse> history =
                historyService.getTransactionHistory(userDetails.getUser(), wallet);

        return ResponseEntity.ok(ApiResponse.<List<TransactionHistoryResponse>>builder()
                .success(true)
                .message("Lấy lịch sử giao dịch thành công")
                .data(history)
                .build());
    }
}
