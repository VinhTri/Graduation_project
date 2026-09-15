package com.project.app.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AppearanceRequest {

    @NotBlank(message = "Giao diện không được để trống")
    @Pattern(regexp = "light|dark|system", message = "Giao diện phải là light, dark hoặc system")
    private String themeMode;

    @NotBlank(message = "Ngôn ngữ không được để trống")
    @Pattern(regexp = "vi|en", message = "Ngôn ngữ phải là vi hoặc en")
    private String language;
}
