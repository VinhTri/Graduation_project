package com.project.app.wallet.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.service.WalletService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final com.project.app.transaction.repository.TransactionRepository transactionRepository;

    @Data
    @Builder
    public static class WalletDto {
        private Long id;
        private String name;
        private BigDecimal balance;
        private String accountNumber;
        @com.fasterxml.jackson.annotation.JsonProperty("isDefault")
        private boolean isDefault;
        
        @com.fasterxml.jackson.annotation.JsonProperty("isLimitEnabled")
        private boolean isLimitEnabled;
        private BigDecimal transactionLimit;
        private BigDecimal dailyLimit;
        private BigDecimal dailyTransactedAmount;
        private String walletType;
    }

    // ====================== LẤY THÔNG TIN V�? ======================
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletDto>> getMyDefaultWallet(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Wallet wallet = walletService.getDefaultWallet(userDetails.getUser().getId());
        
        // Tính tổng giao dịch trong ngày
        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        java.util.List<com.project.app.transaction.enums.TransactionType> types = java.util.Arrays.asList(
            com.project.app.transaction.enums.TransactionType.WITHDRAW,
            com.project.app.transaction.enums.TransactionType.TRANSFER,
            com.project.app.transaction.enums.TransactionType.PAYMENT
        );
        
        BigDecimal dailyTransactedAmount = transactionRepository.sumDailyTransactedAmount(
            wallet.getId(), 
            types, 
            com.project.app.transaction.enums.TransactionStatus.SUCCESS, 
            startOfDay
        );
        
        WalletDto dto = WalletDto.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .accountNumber(wallet.getAccountNumber())
                .isDefault(wallet.isDefault())
                .isLimitEnabled(wallet.isLimitEnabled())
                .transactionLimit(wallet.getTransactionLimit())
                .dailyLimit(wallet.getDailyLimit())
                .dailyTransactedAmount(dailyTransactedAmount)
                .walletType(wallet.getWalletType() != null ? wallet.getWalletType().name() : "MAIN")
                .build();

        return ResponseEntity.ok(ApiResponse.<WalletDto>builder()
                .success(true)
                .message("Lấy thông tin ví thành công")
                .data(dto)
                .build());
    }

    // ====================== LẤY VÍ TIỀN MẶT (SỔ TAY) ======================
    @GetMapping("/cash")
    public ResponseEntity<ApiResponse<WalletDto>> getMyCashWallet(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Wallet wallet = walletService.getOrCreateCashWallet(userDetails.getUser().getId());

        WalletDto dto = WalletDto.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .accountNumber(null)
                .isDefault(wallet.isDefault())
                .isLimitEnabled(false)
                .walletType(wallet.getWalletType() != null ? wallet.getWalletType().name() : "CASH")
                .build();

        return ResponseEntity.ok(ApiResponse.<WalletDto>builder()
                .success(true)
                .message("Lấy thông tin ví tiền mặt thành công")
                .data(dto)
                .build());
    }

    // ====================== CẬP NHẬT THIẾT LẬP VÍ ======================
    @org.springframework.web.bind.annotation.PutMapping("/{id}/settings")
    public ResponseEntity<ApiResponse<Void>> updateWalletSettings(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody com.project.app.wallet.dto.WalletSettingsDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        walletService.updateWalletSettings(id, userDetails.getUser().getId(), request);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Cập nhật thiết lập ví thành công")
                .build());
    }

    // ====================== THIẾT LẬP S�? TÀI KHOẢN ======================
    @org.springframework.web.bind.annotation.PostMapping("/setup-account")
    public ResponseEntity<ApiResponse<WalletDto>> setupAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.project.app.wallet.dto.request.SetupAccountRequest request) {
        
        Wallet wallet = walletService.setupAccount(userDetails.getUser(), request);
        
        WalletDto dto = WalletDto.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .accountNumber(wallet.getAccountNumber())
                .isDefault(wallet.isDefault())
                .isLimitEnabled(wallet.isLimitEnabled())
                .transactionLimit(wallet.getTransactionLimit())
                .dailyLimit(wallet.getDailyLimit())
                // Không tính giao dịch ngày ở endpoint này để trả v? nhanh
                .build();

        return ResponseEntity.ok(ApiResponse.<WalletDto>builder()
                .success(true)
                .message("Thiết lập số tài khoản ví thành công")
                .data(dto)
                .build());
    }

    // ====================== LẤY DANH SÁCH VÍ NGÂN HÀNG ======================
    @GetMapping("/banks")
    public ResponseEntity<ApiResponse<java.util.List<WalletDto>>> getBankWallets(@AuthenticationPrincipal CustomUserDetails userDetails) {
        java.util.List<Wallet> wallets = walletService.getBankWallets(userDetails.getUser().getId());
        
        java.util.List<WalletDto> dtoList = wallets.stream().map(wallet -> WalletDto.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .accountNumber(wallet.getAccountNumber())
                .isDefault(wallet.isDefault())
                .isLimitEnabled(wallet.isLimitEnabled())
                .transactionLimit(wallet.getTransactionLimit())
                .dailyLimit(wallet.getDailyLimit())
                .walletType(wallet.getWalletType() != null ? wallet.getWalletType().name() : "MANUAL")
                .build()).toList();

        return ResponseEntity.ok(ApiResponse.<java.util.List<WalletDto>>builder()
                .success(true)
                .message("Lấy danh sách ví ngân hàng thành công")
                .data(dtoList)
                .build());
    }

    // ====================== TẠO VÍ NGÂN HÀNG THỦ CÔNG ======================
    @Data
    public static class CreateManualBankRequest {
        @jakarta.validation.constraints.NotBlank(message = "Tên ngân hàng không được để trống")
        private String bankName;
        private String accountNumber;
    }

    @org.springframework.web.bind.annotation.PostMapping("/manual-bank")
    public ResponseEntity<ApiResponse<WalletDto>> createManualBankWallet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody CreateManualBankRequest request) {
        
        Wallet wallet = walletService.createManualBankWallet(userDetails.getUser().getId(), request.getBankName(), request.getAccountNumber());
        
        WalletDto dto = WalletDto.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .accountNumber(wallet.getAccountNumber())
                .isDefault(wallet.isDefault())
                .isLimitEnabled(wallet.isLimitEnabled())
                .walletType(wallet.getWalletType().name())
                .build();

        return ResponseEntity.ok(ApiResponse.<WalletDto>builder()
                .success(true)
                .message("Thêm sổ tay tài khoản ngân hàng thành công")
                .data(dto)
                .build());
    }
    @org.springframework.web.bind.annotation.DeleteMapping("/manual-bank/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteManualBankWallet(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        walletService.deleteManualBankWallet(id, userDetails.getUser().getId());

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa sổ tay tài khoản ngân hàng thành công")
                .build());
    }
}
