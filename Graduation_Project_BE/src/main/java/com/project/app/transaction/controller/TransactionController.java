package com.project.app.transaction.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.transaction.dto.request.TopUpRequest;
import com.project.app.transaction.dto.response.TopUpResponse;
import com.project.app.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.project.app.transaction.dto.request.SePayWebhookRequest;
import com.project.app.transaction.dto.request.WithdrawRequest;
import com.project.app.transaction.dto.response.TransactionStatusResponse;
import com.project.app.transaction.dto.response.WithdrawResponse;
import com.project.app.transaction.entity.Transaction;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ====================== NẠP TIỀN ======================
    @PostMapping("/top-up")
    public ResponseEntity<ApiResponse<TopUpResponse>> initiateTopUp(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TopUpRequest request) {
        
        TopUpResponse response = transactionService.initiateTopUp(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<TopUpResponse>builder()
                .success(true)
                .message("Khởi tạo giao dịch nạp tiền thành công")
                .data(response)
                .build());
    }

    // ====================== WEBHOOK SEPAY ======================
    @PostMapping("/sepay-webhook")
    public ResponseEntity<ApiResponse<Void>> handleSePayWebhook(@RequestBody SePayWebhookRequest request) {
        transactionService.processSePayWebhook(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Webhook processed successfully")
                .build());
    }

    // ====================== TRA CỨU GIAO DỊCH ======================
    @GetMapping("/{transactionCode}")
    public ResponseEntity<ApiResponse<TransactionStatusResponse>> getTransactionStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode) {
        
        Transaction transaction = transactionService.getTransactionByCode(transactionCode, userDetails.getUser());
        TransactionStatusResponse response = new TransactionStatusResponse(
                transaction.getTransactionCode(),
                transaction.getStatus(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
        return ResponseEntity.ok(ApiResponse.<TransactionStatusResponse>builder()
                .success(true)
                .message("Lấy thông tin giao dịch thành công")
                .data(response)
                .build());
    }

    // ====================== RÚT TIỀN ======================
    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WithdrawResponse>> processWithdrawal(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody WithdrawRequest request) {
        
        WithdrawResponse response = transactionService.processWithdrawal(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<WithdrawResponse>builder()
                .success(true)
                .message("Rút tiền thành công")
                .data(response)
                .build());
    }
}
