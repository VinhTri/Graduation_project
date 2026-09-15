package com.project.app.support.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupportStatusRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status;
}
