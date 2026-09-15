package com.project.app.support.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupportMessageRequest {
    @NotBlank(message = "Nội dung không được để trống")
    private String content;
}
