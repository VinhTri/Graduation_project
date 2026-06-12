package com.project.app.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // ---- CÁC LỖI CỦA AUTH & USER ----
    USER_NOT_FOUND("Tài khoản chưa có trong hệ thống!", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("Email này đã được sử dụng!", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS("Tên đăng nhập này đã tồn tại!", HttpStatus.CONFLICT),
    INVALID_GOOGLE_TOKEN("Google ID Token không hợp lệ!", HttpStatus.UNAUTHORIZED),
    GOOGLE_AUTH_FAILED("Xác thực bằng tài khoản Google thất bại!", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS("Tên đăng nhập hoặc mật khẩu không chính xác!", HttpStatus.UNAUTHORIZED),
    INVALID_OTP("Mã OTP không hợp lệ hoặc đã được sử dụng!", HttpStatus.BAD_REQUEST),
    EXPIRED_OTP("Mã OTP đã hết hạn!", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_ACCESS("Bạn không có quyền thực hiện hành động này!", HttpStatus.FORBIDDEN),

    // ---- LỖI HỆ THỐNG CHUNG ----
    UNCATEGORIZED_EXCEPTION("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau!", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(String message, HttpStatus statusCode) {
        this.message = message;
        this.statusCode = statusCode;
    }

    public String getMessage() {
        return message;
    }

    public HttpStatus getStatusCode() {
        return statusCode;
    }
}
