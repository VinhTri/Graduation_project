package com.project.app.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    /** Tên hiển thị = phần trước @ của email (lưu trong DB column username). */
    private String username;
    private String email;
    private String role;
    /** Ký hiệu tiền tệ: dong | vnd */
    private String moneySuffix;
    /** Cách viết số: comma | dot */
    private String moneySeparator;
    /** Giao diện: light | dark | system */
    private String themeMode;
    /** Ngôn ngữ: vi | en */
    private String language;
    /** Tài khoản đang bị khóa bảo mật và cần OTP để mở khóa. */
    private boolean securityLocked;
}
