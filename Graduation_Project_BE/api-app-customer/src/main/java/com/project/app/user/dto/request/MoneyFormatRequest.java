package com.project.app.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class MoneyFormatRequest {

    @NotBlank(message = "Ký hiệu tiền tệ không được để trống")
    @Pattern(regexp = "dong|vnd", message = "Ký hiệu tiền tệ phải là dong hoặc vnd")
    private String suffix;

    @NotBlank(message = "Cách viết số không được để trống")
    @Pattern(regexp = "dot|comma", message = "Cách viết số phải là dot hoặc comma")
    private String separator;
}
