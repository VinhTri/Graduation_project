package com.project.app.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // ---- CÁC LỖI CỦA AUTH & USER ----
    USER_NOT_FOUND("Tài khoản chưa có trong hệ thống!", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("Email này đã được sử dụng!", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS("Tên đăng nhập này đã tồn tại!", HttpStatus.CONFLICT),
    INVALID_GOOGLE_TOKEN("Google ID Token không hợp lệ!", HttpStatus.UNAUTHORIZED),
    GOOGLE_AUTH_FAILED("Xác thực bằng tài khoản Google thất bại!", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS("Sai mật khẩu!", HttpStatus.UNAUTHORIZED),
    INVALID_OTP("Mã OTP không hợp lệ hoặc đã được sử dụng!", HttpStatus.BAD_REQUEST),
    EXPIRED_OTP("Mã OTP đã hết hạn!", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_ACCESS("Bạn không có quyền thực hiện hành động này!", HttpStatus.FORBIDDEN),

    // ---- LỖI VÍ & GIAO DỊCH ----
    INVALID_PIN("Mã PIN không chính xác!", HttpStatus.BAD_REQUEST),
    WALLET_NOT_FOUND("Không tìm thấy ví khả dụng!", HttpStatus.NOT_FOUND),
    INVALID_TRANSACTION("Giao dịch không hợp lệ hoặc đã xử lý!", HttpStatus.BAD_REQUEST),
    BANK_ACCOUNT_NOT_FOUND("Không tìm thấy thông tin tài khoản ngân hàng!", HttpStatus.BAD_REQUEST),
    BANK_ACCOUNT_ALREADY_EXISTS("Tài khoản ngân hàng này đã được liên kết với ví của bạn!", HttpStatus.CONFLICT),
    INSUFFICIENT_BALANCE("Số dư trong ví không đủ để thực hiện giao dịch!", HttpStatus.BAD_REQUEST),

    // ---- LỖI DANH MỤC ----
    CATEGORY_GROUP_NOT_FOUND("Không tìm thấy nhóm danh mục!", HttpStatus.NOT_FOUND),
    CATEGORY_ITEM_NOT_FOUND("Không tìm thấy danh mục!", HttpStatus.NOT_FOUND),
    CATEGORY_ITEM_LIMIT_EXCEEDED("Mỗi nhóm danh mục chỉ được tối đa 8 danh mục con!", HttpStatus.BAD_REQUEST),

    // ---- LỖI BÀI VIẾT ----
    POST_NOT_FOUND("Không tìm thấy bài viết này!", HttpStatus.NOT_FOUND),

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
