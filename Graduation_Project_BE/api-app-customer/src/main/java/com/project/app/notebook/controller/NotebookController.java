package com.project.app.notebook.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.notebook.dto.NotebookBookResponse;
import com.project.app.notebook.dto.NotebookTransactionResponse;
import com.project.app.notebook.dto.request.NotebookTransactionRequest;
import com.project.app.notebook.service.NotebookBookService;
import com.project.app.notebook.service.NotebookTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notebooks")
@RequiredArgsConstructor
public class NotebookController {

    private final NotebookBookService notebookBookService;
    private final NotebookTransactionService notebookTransactionService;

    @GetMapping("/cash")
    public ResponseEntity<ApiResponse<NotebookBookResponse>> getCashBook(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        NotebookBookResponse book = notebookBookService.getOrCreateCashBook(userId);
        return ApiResponse.ok("Thành công", book);
    }

    @GetMapping("/{bookId}/transactions")
    public ResponseEntity<ApiResponse<List<NotebookTransactionResponse>>> getTransactions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "MONTH") String period) {
        Long userId = userDetails.getUser().getId();
        List<NotebookTransactionResponse> transactions =
                notebookTransactionService.getTransactions(userId, bookId, period);
        return ApiResponse.ok("Thành công", transactions);
    }

    @GetMapping("/transactions/{transactionCode}")
    public ResponseEntity<ApiResponse<NotebookTransactionResponse>> getTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode) {
        Long userId = userDetails.getUser().getId();
        NotebookTransactionResponse transaction =
                notebookTransactionService.getTransaction(userId, transactionCode);
        return ApiResponse.ok("Thành công", transaction);
    }

    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<NotebookTransactionResponse>> createTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody NotebookTransactionRequest request) {
        Long userId = userDetails.getUser().getId();
        NotebookTransactionResponse transaction =
                notebookTransactionService.createTransaction(userId, request);
        return ApiResponse.ok("Ghi chép thành công!", transaction);
    }

    @PutMapping("/transactions/{transactionCode}")
    public ResponseEntity<ApiResponse<NotebookTransactionResponse>> updateTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode,
            @Valid @RequestBody NotebookTransactionRequest request) {
        Long userId = userDetails.getUser().getId();
        NotebookTransactionResponse transaction =
                notebookTransactionService.updateTransaction(userId, transactionCode, request);
        return ApiResponse.ok("Cập nhật giao dịch thành công!", transaction);
    }

    @DeleteMapping("/transactions/{transactionCode}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String transactionCode) {
        Long userId = userDetails.getUser().getId();
        notebookTransactionService.deleteTransaction(userId, transactionCode);
        return ApiResponse.ok("Xóa giao dịch thành công!");
    }
}
