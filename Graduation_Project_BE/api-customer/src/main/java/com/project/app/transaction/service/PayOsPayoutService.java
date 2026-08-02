package com.project.app.transaction.service;

public interface PayOsPayoutService {
    void createPayout(String bankCode, String accountNumber, String accountName, int amount, String description, String reference);

    /**
     * Chi thật một khoản (tối thiểu 2.000đ theo Napas) tới STK cần xác minh.
     * PayOS trả về tên chủ tài khoản (toAccountName) khi lệnh được tạo/chi.
     * Trả về null nếu STK sai hoặc lỗi.
     */
    String verifyAndPayout(String bankCode, String accountNumber, int amount, String description, String reference);
}
