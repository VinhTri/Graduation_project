package com.project.app.category.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryGroupResponse {
    private String id; // Using String to match FE type easily
    private String title;
    private String icon;
    private String color;
    private String bgColor;
    private List<CategoryItemResponse> items;
}
