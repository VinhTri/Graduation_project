package com.project.app.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUserStatusRequest {
    @NotNull(message = "Trạng thái tài khoản không được để trống")
    private Boolean active;

    @NotBlank(message = "Lý do thay đổi trạng thái không được để trống")
    @Size(min = 5, max = 300, message = "Lý do phải có từ 5 đến 300 ký tự")
    private String reason;
}
