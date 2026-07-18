package com.project.app.history.service;

import com.project.app.history.dto.response.TransactionHistoryResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface HistoryService {
    List<TransactionHistoryResponse> getTransactionHistory(User user);

    /** wallet=cash → sổ tay; còn lại → ví SmartSpend (MAIN) */
    List<TransactionHistoryResponse> getTransactionHistory(User user, String wallet);
}
