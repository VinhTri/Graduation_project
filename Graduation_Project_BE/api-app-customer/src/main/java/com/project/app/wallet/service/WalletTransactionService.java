package com.project.app.wallet.service;

import com.project.app.wallet.dto.WalletTransactionResponse;
import com.project.app.wallet.dto.request.WalletWithdrawRequest;

import java.util.List;

public interface WalletTransactionService {

    WalletTransactionResponse withdraw(Long userId, WalletWithdrawRequest request);

    List<WalletTransactionResponse> getHistory(Long userId);
}
