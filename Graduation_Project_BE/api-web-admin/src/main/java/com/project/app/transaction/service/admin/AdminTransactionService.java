package com.project.app.transaction.service.admin;

import com.project.app.transaction.dto.response.AdminTransactionResponse;

import java.util.List;

public interface AdminTransactionService {
    List<AdminTransactionResponse> getAllTransactions();
}
