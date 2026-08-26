package com.project.app.transaction.service;

public interface PayOsPayoutService {
    void createPayout(String bankCode, String accountNumber, String accountName, long amount,
                      String description, String reference);

    /**
     * Chuyển một khoản mồi thật tới tài khoản cần xác minh.
     * Trả về tên chủ tài khoản do PayOS xác nhận, hoặc null nếu không xác minh được.
     */
    String verifyAndPayout(String bankCode, String accountNumber, int amount,
                           String description, String reference);
}
