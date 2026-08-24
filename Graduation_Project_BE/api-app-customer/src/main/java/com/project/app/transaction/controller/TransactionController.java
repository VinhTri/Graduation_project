package com.project.app.transaction.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.transaction.dto.request.TransferRequest;
import com.project.app.transaction.dto.response.TransferResponse;
import com.project.app.transaction.dto.response.TransactionStatusResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
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

    // ====================== GIAO DỊCH THỦ CÔNG SỔ TAY NGÂN HÀNG ======================
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<com.project.app.transaction.dto.response.ManualTransactionResponse>> createManualTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody com.project.app.transaction.dto.request.ManualTransactionRequest request) {

        var response = transactionService.createManualTransaction(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<com.project.app.transaction.dto.response.ManualTransactionResponse>builder()
                .success(true)
                .message("Ghi giao dịch sổ tay ngân hàng thành công")
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