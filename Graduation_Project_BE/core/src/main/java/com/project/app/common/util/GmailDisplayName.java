package com.project.app.common.util;

/**
 * Tên hiển thị lấy từ phần local của Gmail (trước {@code @}).
 */
public final class GmailDisplayName {

    private GmailDisplayName() {}

    public static String fromEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email không hợp lệ");
        }
        String trimmed = email.trim();
        int at = trimmed.indexOf('@');
        if (at <= 0) {
            throw new IllegalArgumentException("Email không hợp lệ");
        }
        return trimmed.substring(0, at);
    }
}
