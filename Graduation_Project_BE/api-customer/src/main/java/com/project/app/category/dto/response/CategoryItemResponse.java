package com.project.app.category.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryItemResponse {
    private String id;
    private String label;
    private String icon;
    private String color;
    private String bgColor;
    private String groupId;
    private boolean isCustom;
}
