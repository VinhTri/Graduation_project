package com.project.app.history.service;

import com.project.app.history.dto.response.TransactionHistoryResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface HistoryService {
    List<TransactionHistoryResponse> getTransactionHistory(User user);

    /** wallet = walletId số → sổ tay ngân hàng; còn lại → ví MAIN */
    List<TransactionHistoryResponse> getTransactionHistory(User user, String wallet);
}
