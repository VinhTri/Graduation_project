package com.project.app.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryGroupRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String icon = "apps";
    private String color = "#64748B";
    private String bgColor = "#F1F5F9";
}
