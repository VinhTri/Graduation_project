package com.project.app.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryItemRequest {

    @NotNull(message = "Nhóm danh mục là bắt buộc")
    private Long groupId;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 20, message = "Tên danh mục tối đa 20 ký tự")
    private String label;

    private String icon = "ellipse-outline";

    private String color = "#6B7280";

    private String bgColor = "#F3F4F6";
}
