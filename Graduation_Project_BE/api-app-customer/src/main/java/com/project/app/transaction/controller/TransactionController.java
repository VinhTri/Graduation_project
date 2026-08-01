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
import com.project.app.transaction.dto.request.TransferRequest;
import com.project.app.transaction.dto.response.TransferResponse;
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
    public ResponseEntity<ApiResponse<Void>> handleSePayWebhook(
            @RequestHeader(value = "Authorization", required = false) String apikey,
            @RequestBody SePayWebhookRequest request) {
        transactionService.processSePayWebhook(apikey, request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Webhook processed successfully")
                .build());
    }

    // ====================== CẬP NHẬT GIAO DỊCH ======================
    @PutMapping("/{transactionCode}")
    public ResponseEntity<ApiResponse<TransactionStatusResponse>> updateTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode,
            @RequestBody com.project.app.transaction.dto.request.UpdateTransactionRequest request) {
        
        Transaction transaction = transactionService.updateTransaction(transactionCode, userDetails.getUser(), request);
        TransactionStatusResponse response = new TransactionStatusResponse(
                transaction.getTransactionCode(),
                transaction.getStatus(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
        return ResponseEntity.ok(ApiResponse.<TransactionStatusResponse>builder()
                .success(true)
                .message("Cập nhật giao dịch thành công")
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

    // ====================== GIAO DỊCH THỦ CÔNG TIỀN MẶT ======================
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<com.project.app.transaction.dto.response.ManualTransactionResponse>> createManualTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody com.project.app.transaction.dto.request.ManualTransactionRequest request) {

        var response = transactionService.createManualTransaction(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<com.project.app.transaction.dto.response.ManualTransactionResponse>builder()
                .success(true)
                .message("Ghi giao dịch tiền mặt thành công")
                .data(response)
                .build());
    }

    @PutMapping("/manual/{transactionCode}")
    public ResponseEntity<ApiResponse<com.project.app.transaction.dto.response.ManualTransactionResponse>> updateManualTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode,
            @Valid @RequestBody com.project.app.transaction.dto.request.ManualTransactionRequest request) {

        var response = transactionService.updateManualTransaction(transactionCode, userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<com.project.app.transaction.dto.response.ManualTransactionResponse>builder()
                .success(true)
                .message("Cập nhật giao dịch thành công")
                .data(response)
                .build());
    }

    @DeleteMapping("/manual/{transactionCode}")
    public ResponseEntity<ApiResponse<Void>> deleteManualTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode) {

        transactionService.deleteManualTransaction(transactionCode, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa giao dịch thành công")
                .build());
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransferResponse>> processTransfer(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TransferRequest request) {

        TransferResponse response = transactionService.processTransfer(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<TransferResponse>builder()
                .success(true)
                .message("Chuyển tiền thành công")
                .data(response)
                .build());
    }

}