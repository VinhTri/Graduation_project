package com.project.app.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUsernameRequest {
    @NotBlank(message = "Tên hiển thị không được để trống")
    @Size(max = 50, message = "Tên hiển thị không được vượt quá 50 ký tự")
    private String username;
}
