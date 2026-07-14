package com.project.app.transaction.service;

public interface PayOsPayoutService {
    void createPayout(String bankCode, String accountNumber, String accountName, int amount, String description, String reference);
    String lookupAccountName(String bankCode, String accountNumber);
}
