package com.project.app.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // ---- CÁC LỖI CỦA AUTH & USER ----
    USER_NOT_FOUND("AUTH_1001", "Tài khoản chưa có trong hệ thống!", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("AUTH_1002", "Email này đã được sử dụng!", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS("AUTH_1003", "Tên đăng nhập này đã tồn tại!", HttpStatus.CONFLICT),
    INVALID_GOOGLE_TOKEN("AUTH_1004", "Google ID Token không hợp lệ!", HttpStatus.UNAUTHORIZED),
    GOOGLE_AUTH_FAILED("AUTH_1005", "Xác thực bằng tài khoản Google thất bại!", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS("AUTH_1006", "Sai mật khẩu!", HttpStatus.UNAUTHORIZED),
    INVALID_OTP("AUTH_1007", "Mã OTP không hợp lệ hoặc đã được sử dụng!", HttpStatus.BAD_REQUEST),
    EXPIRED_OTP("AUTH_1008", "Mã OTP đã hết hạn!", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_ACCESS("AUTH_1009", "Bạn không có quyền thực hiện hành động này!", HttpStatus.FORBIDDEN),
    SAME_PASSWORD("AUTH_1011", "Mật khẩu mới phải khác mật khẩu hiện tại!", HttpStatus.BAD_REQUEST),
    SAME_PIN("AUTH_1012", "Mã PIN mới phải khác mã PIN hiện tại!", HttpStatus.BAD_REQUEST),
    PIN_NOT_SET("AUTH_1013", "Bạn chưa thiết lập mã PIN!", HttpStatus.BAD_REQUEST),

    // ---- LỖI VÍ & GIAO DỊCH ----
    INVALID_PIN("WALL_2001", "Mã PIN không chính xác!", HttpStatus.BAD_REQUEST),
    WALLET_NOT_FOUND("WALL_2002", "Không tìm thấy ví khả dụng!", HttpStatus.NOT_FOUND),
    INVALID_TRANSACTION("TX_3001", "Giao dịch không hợp lệ hoặc đã xử lý!", HttpStatus.BAD_REQUEST),
    BANK_ACCOUNT_NOT_FOUND("BANK_4001", "Không tìm thấy thông tin tài khoản ngân hàng!", HttpStatus.BAD_REQUEST),
    BANK_ACCOUNT_ALREADY_EXISTS("BANK_4002", "Tài khoản ngân hàng này đã được liên kết với ví của bạn!", HttpStatus.CONFLICT),
    INSUFFICIENT_BALANCE("WALL_2003", "Số dư trong ví không đủ để thực hiện giao dịch!", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT("WALL_2007", "Số tiền không hợp lệ!", HttpStatus.BAD_REQUEST),
    BANK_VERIFICATION_FAILED("BANK_4003", "Không thể xác minh thông tin ngân hàng! Vui lòng kiểm tra lại số tài khoản.", HttpStatus.BAD_REQUEST),
    BANK_ACCOUNT_LIMIT_REACHED("BANK_4004", "Bạn chỉ có thể liên kết tối đa 3 tài khoản ngân hàng!", HttpStatus.BAD_REQUEST),
    DUPLICATE_WEBHOOK("TX_3002", "Giao dịch này đã được xử lý trước đó!", HttpStatus.CONFLICT),
    ACCOUNT_LOCKED("AUTH_1010", "Tài khoản đã bị khóa do nhập sai PIN nhiều lần. Vui lòng thử lại sau!", HttpStatus.FORBIDDEN),
    ACCOUNT_NUMBER_NOT_FOUND("WALL_2004", "Ví chưa được thiết lập số tài khoản. Vui lòng thiết lập số tài khoản trước!", HttpStatus.BAD_REQUEST),
    WITHDRAW_FAILED("TX_3003", "Xảy ra lỗi trong quá trình rút tiền. Vui lòng thử lại sau!", HttpStatus.INTERNAL_SERVER_ERROR),
    ACCOUNT_ALREADY_SETUP("WALL_2005", "Ví này đã được thiết lập số tài khoản!", HttpStatus.CONFLICT),
    ACCOUNT_NUMBER_ALREADY_EXISTS("WALL_2006", "Số tài khoản này đã được người khác sử dụng!", HttpStatus.CONFLICT),

    // ---- LỖI DANH MỤC ----
    CATEGORY_GROUP_NOT_FOUND("CAT_5001", "Không tìm thấy nhóm danh mục!", HttpStatus.NOT_FOUND),
    CATEGORY_ITEM_NOT_FOUND("CAT_5002", "Không tìm thấy danh mục!", HttpStatus.NOT_FOUND),
    CATEGORY_ITEM_LIMIT_EXCEEDED("CAT_5003", "Mỗi nhóm danh mục chỉ được tối đa 4 danh mục!", HttpStatus.BAD_REQUEST),
    CATEGORY_GROUP_LIMIT_EXCEEDED("CAT_5004", "Bạn chỉ có thể tạo tối đa 6 nhóm danh mục!", HttpStatus.BAD_REQUEST),
    CATEGORY_ITEM_NOT_EDITABLE("CAT_5005", "Danh mục không thể chỉnh sửa. Vui lòng xóa và tạo lại!", HttpStatus.BAD_REQUEST),
    CATEGORY_GROUP_COLOR_TAKEN("CAT_5006", "Màu nhóm này đã được sử dụng!", HttpStatus.BAD_REQUEST),
    CATEGORY_ITEM_COLOR_TAKEN("CAT_5007", "Màu danh mục này đã được sử dụng!", HttpStatus.BAD_REQUEST),
    CATEGORY_INVALID_FOR_CASH("CAT_5008", "Danh mục không hợp lệ cho sổ tay tiền mặt!", HttpStatus.BAD_REQUEST),
    CATEGORY_GROUP_NAME_TOO_LONG("CAT_5009", "Tên nhóm tối đa 24 ký tự!", HttpStatus.BAD_REQUEST),
    CATEGORY_ITEM_NAME_TOO_LONG("CAT_5010", "Tên danh mục tối đa 20 ký tự!", HttpStatus.BAD_REQUEST),
    INVALID_MANUAL_TRANSACTION_TYPE("TX_3004", "Loại giao dịch thủ công chỉ được là EXPENSE hoặc INCOME!", HttpStatus.BAD_REQUEST),

    // ---- LỖI HÓA ĐƠN ----
    INVOICE_NOT_FOUND("INV_6001", "Không tìm thấy hóa đơn!", HttpStatus.NOT_FOUND),

    // ---- LỖI BÀI VIẾT ----
    POST_NOT_FOUND("POST_7001", "Không tìm thấy bài viết!", HttpStatus.NOT_FOUND),

    // ---- LỖI QUỸ NHÓM ----
    FUND_NOT_FOUND("FUND_8001", "Không tìm thấy quỹ!", HttpStatus.NOT_FOUND),
    FUND_OWNER_LIMIT_EXCEEDED("FUND_8002", "Bạn chỉ có thể tạo tối đa 6 quỹ!", HttpStatus.BAD_REQUEST),
    FUND_JOINED_LIMIT_EXCEEDED("FUND_8003", "Bạn chỉ có thể tham gia tối đa 6 quỹ!", HttpStatus.BAD_REQUEST),
    FUND_COLOR_TAKEN("FUND_8004", "Màu quỹ này đã được sử dụng!", HttpStatus.BAD_REQUEST),
    FUND_NOT_OWNER("FUND_8005", "Chỉ chủ quỹ mới được thực hiện thao tác này!", HttpStatus.FORBIDDEN),
    FUND_HAS_BALANCE("FUND_8006", "Phải rút hết tiền về ví trước khi xóa quỹ!", HttpStatus.BAD_REQUEST),
    FUND_INSUFFICIENT_BALANCE("FUND_8007", "Số dư quỹ không đủ!", HttpStatus.BAD_REQUEST),
    FUND_NOT_MEMBER("FUND_8008", "Bạn không phải thành viên của quỹ này!", HttpStatus.FORBIDDEN),
    FUND_INVALID_AMOUNT("FUND_8009", "Số tiền không hợp lệ (tối thiểu 10.000đ)!", HttpStatus.BAD_REQUEST),
    FUND_TARGET_REQUIRED("FUND_8010", "Mục tiêu quỹ là bắt buộc (tối thiểu 10.000đ)!", HttpStatus.BAD_REQUEST),
    FUND_ALREADY_MEMBER("FUND_8011", "Người này đã là thành viên của quỹ!", HttpStatus.CONFLICT),
    FUND_INVITE_EXISTS("FUND_8012", "Đã gửi lời mời cho người này rồi!", HttpStatus.CONFLICT),
    FUND_INVITE_NOT_FOUND("FUND_8013", "Không tìm thấy lời mời tham gia quỹ!", HttpStatus.NOT_FOUND),
    FUND_CANNOT_INVITE_SELF("FUND_8014", "Không thể tự mời chính mình!", HttpStatus.BAD_REQUEST),
    FUND_OWNER_CANNOT_LEAVE("FUND_8016", "Chủ quỹ không thể rời quỹ. Hãy xóa quỹ thay vì rời!", HttpStatus.BAD_REQUEST),
    FUND_MEMBER_LIMIT_EXCEEDED("FUND_8017", "Quỹ đã đạt tối đa 10 thành viên!", HttpStatus.BAD_REQUEST),

    // ---- LỖI HỆ THỐNG CHUNG ----
    UNCATEGORIZED_EXCEPTION("SYS_9999", "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau!", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(String code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public HttpStatus getStatusCode() {
        return statusCode;
    }
}
