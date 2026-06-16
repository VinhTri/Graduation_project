package com.project.app.bankaccount.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;

import com.project.app.bankaccount.dto.request.BankAccountRequest;
import com.project.app.bankaccount.dto.response.BankAccountResponse;
import com.project.app.transaction.service.PayOsPayoutService;
import com.project.app.bankaccount.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;
    private final PayOsPayoutService payOsPayoutService;

    // ====================== DANH SÁCH NGÂN HÀNG ======================
    @GetMapping
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getBankAccounts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<BankAccountResponse> response = bankAccountService.getBankAccounts(userDetails.getUser());
        
        return ResponseEntity.ok(ApiResponse.<List<BankAccountResponse>>builder()
                .success(true)
                .message("Lấy danh sách ngân hàng liên kết thành công")
                .data(response)
                .build());
    }

    // ====================== THÊM NGÂN HÀNG ======================
    @PostMapping
    public ResponseEntity<ApiResponse<BankAccountResponse>> addBankAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BankAccountRequest request) {
        
        BankAccountResponse response = bankAccountService.addBankAccount(userDetails.getUser(), request);
        
        return ResponseEntity.ok(ApiResponse.<BankAccountResponse>builder()
                .success(true)
                .message("Liên kết ngân hàng thành công")
                .data(response)
                .build());
    }

    // ====================== TRA CỨU TÊN CHỦ TÀI KHOẢN ======================
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<String>> lookupBankAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String bankCode,
            @RequestParam String accountNumber) {
        
        String accountName = payOsPayoutService.lookupAccountName(bankCode, accountNumber);
        
        if (accountName != null) {
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("Tra cứu tên chủ tài khoản thành công")
                    .data(accountName)
                    .build());
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.<String>builder()
                    .success(false)
                    .message("Không tìm thấy thông tin tài khoản hoặc ngân hàng không hỗ trợ")
                    .build());
        }
    }


}
