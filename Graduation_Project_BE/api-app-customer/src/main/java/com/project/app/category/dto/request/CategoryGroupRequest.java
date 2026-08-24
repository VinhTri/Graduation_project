package com.project.app.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryGroupRequest {

    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(max = 24, message = "Tên nhóm tối đa 24 ký tự")
    private String title;

    private String icon = "apps";

    private String color = "#64748B";

    private String bgColor = "#F1F5F9";
}
