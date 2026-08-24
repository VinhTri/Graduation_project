package com.project.app.wallet.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.auth.service.AuthService;
import com.project.app.common.dto.ApiResponse;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.wallet.dto.WalletResponse;
import com.project.app.wallet.dto.WalletTransactionResponse;
import com.project.app.wallet.dto.request.WalletSettingsRequest;
import com.project.app.wallet.dto.request.WalletWithdrawRequest;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.service.WalletLimitHelper;
import com.project.app.wallet.service.WalletService;
import com.project.app.wallet.service.WalletTransactionService;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final WalletTransactionService walletTransactionService;
    private final WalletRepository walletRepository;
    private final AuthService authService;
    private final WalletLimitHelper walletLimitHelper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WalletResponse>>> getMyWallets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        List<WalletResponse> wallets = walletRepository.findByUserId(userId).stream()
                .filter(w -> w.isDefault() && w.getWalletType() == WalletType.MAIN)
                .map(w -> WalletResponse.from(w, dailyWithdrawnInLimitWindow(userId, w)))
                .toList();
        return ApiResponse.ok("Lấy danh sách ví thành công", wallets);
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<WalletTransactionResponse>>> getTransactions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Lấy lịch sử giao dịch ví thành công", walletTransactionService.getHistory(userDetails.getUser().getId()));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WalletTransactionResponse>> withdraw(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody WalletWithdrawRequest request) {
        WalletTransactionResponse response =
                walletTransactionService.withdraw(userDetails.getUser().getId(), request);
        return ApiResponse.ok("Rút tiền thành công!", response);
    }

    @PutMapping("/{id}/settings")
    public ResponseEntity<ApiResponse<WalletResponse>> updateSettings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody WalletSettingsRequest request) {
        authService.verifyCurrentPin(userDetails.getUser().getId(), request.getCurrentPinCode());

        Wallet wallet = walletRepository.findByIdAndUserId(id, userDetails.getUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        boolean enabled = Boolean.TRUE.equals(request.getEnabled());
        boolean wasDisabled = !wallet.isLimitEnabled();

        BigDecimal transactionLimit = normalizeAmount(request.getTransactionLimit());
        BigDecimal dailyLimit = normalizeAmount(request.getDailyLimit());

        if (enabled) {
            if (transactionLimit == null && dailyLimit == null) {
                throw new AppException(ErrorCode.WALLET_LIMIT_REQUIRED);
            }
            if (transactionLimit != null && dailyLimit != null
                    && transactionLimit.compareTo(dailyLimit) > 0) {
                throw new AppException(ErrorCode.WALLET_LIMIT_INVALID);
            }
            if (wasDisabled) {
                wallet.setLimitActivatedAt(LocalDateTime.now());
            }
            wallet.setLimitEnabled(true);
            wallet.setTransactionLimit(transactionLimit);
            wallet.setDailyLimit(dailyLimit);
        } else {
            wallet.setLimitEnabled(false);
            wallet.setTransactionLimit(null);
            wallet.setDailyLimit(null);
            wallet.setLimitActivatedAt(null);
        }

        Wallet saved = walletRepository.save(wallet);
        return ApiResponse.ok(
                "Cập nhật thiết lập ví thành công!",
                WalletResponse.from(saved, dailyWithdrawnInLimitWindow(userDetails.getUser().getId(), saved))
        );
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletDto>> getMyDefaultWallet(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Wallet wallet = walletService.getDefaultWallet(userDetails.getUser().getId());
        WalletDto dto = toLegacyDto(wallet, dailyWithdrawnInLimitWindow(userDetails.getUser().getId(), wallet));
        return ApiResponse.ok("Lấy thông tin ví thành công", dto);
    }

    @PostMapping("/setup-account")
    public ResponseEntity<ApiResponse<WalletDto>> setupAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody(required = false) com.project.app.wallet.dto.request.SetupAccountRequest request) {
        Wallet wallet = walletService.setupAccount(userDetails.getUser(), request);
        WalletDto dto = toLegacyDto(wallet, dailyWithdrawnInLimitWindow(userDetails.getUser().getId(), wallet));
        return ApiResponse.ok("Số tài khoản ví đã sẵn sàng", dto);
    }

    @GetMapping("/banks")
    public ResponseEntity<ApiResponse<List<WalletDto>>> getBankWallets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<WalletDto> dtoList = walletService.getBankWallets(userDetails.getUser().getId()).stream()
                .map(w -> toLegacyDto(w, BigDecimal.ZERO))
                .toList();
        return ApiResponse.ok("Lấy danh sách ví ngân hàng thành công", dtoList);
    }

    @PostMapping("/manual-bank")
    public ResponseEntity<ApiResponse<WalletDto>> createManualBankWallet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateManualBankRequest request) {
        Wallet wallet = walletService.createManualBankWallet(
                userDetails.getUser().getId(), request.getBankName(), request.getAccountNumber());
        WalletDto dto = toLegacyDto(wallet, BigDecimal.ZERO);
        return ApiResponse.ok("Thêm sổ tay tài khoản ngân hàng thành công", dto);
    }

    @DeleteMapping("/manual-bank/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteManualBankWallet(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        walletService.deleteManualBankWallet(id, userDetails.getUser().getId());
        return ApiResponse.ok("Xóa sổ tay tài khoản ngân hàng thành công");
    }

    private BigDecimal dailyWithdrawnInLimitWindow(Long userId, Wallet wallet) {
        return walletLimitHelper.dailyUsedAmount(userId, wallet);
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return amount;
    }

    private WalletDto toLegacyDto(Wallet wallet, BigDecimal dailyTransactedAmount) {
        return WalletDto.builder()
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
    }

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

    @Data
    public static class CreateManualBankRequest {
        @jakarta.validation.constraints.NotBlank(message = "Tên ngân hàng không được để trống")
        private String bankName;
        private String accountNumber;
    }
}
