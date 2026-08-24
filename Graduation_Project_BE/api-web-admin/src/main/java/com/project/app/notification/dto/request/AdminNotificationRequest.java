package com.project.app.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminNotificationRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 120, message = "Tiêu đề không được vượt quá 120 ký tự")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    @Size(max = 500, message = "Nội dung không được vượt quá 500 ký tự")
    private String message;

    @NotBlank(message = "Phạm vi người nhận không được để trống")
    @Pattern(regexp = "ALL|USER", message = "Phạm vi người nhận không hợp lệ")
    private String audience;

    private Long userId;
}
