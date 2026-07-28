package com.project.app.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryItemRequest {
    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotBlank(message = "Label is required")
    @Size(max = 20, message = "Tên danh mục tối đa 20 ký tự")
    private String label;

    private String icon = "ellipse-outline";
    private String color = "#6B7280";
    private String bgColor = "#F3F4F6";
}
