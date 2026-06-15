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

    @Data
    @Builder
    public static class WalletDto {
        private Long id;
        private String name;
        private BigDecimal balance;
        private boolean isDefault;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletDto>> getMyDefaultWallet(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Wallet wallet = walletService.getDefaultWallet(userDetails.getUser().getId());
        
        WalletDto dto = WalletDto.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .isDefault(wallet.isDefault())
                .build();

        return ResponseEntity.ok(ApiResponse.<WalletDto>builder()
                .success(true)
                .message("Lấy thông tin ví thành công")
                .data(dto)
                .build());
    }
}
