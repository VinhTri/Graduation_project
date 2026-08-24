package com.project.app.category.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.project.app.category.entity.CategoryItem;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CategoryItemResponse {

    Long id;
    String label;
    String icon;
    String color;
    String bgColor;
    Long groupId;
    @JsonProperty("custom")
    boolean custom;

    public static CategoryItemResponse from(CategoryItem item) {
        return CategoryItemResponse.builder()
                .id(item.getId())
                .label(item.getLabel())
                .icon(item.getIcon())
                .color(item.getColor())
                .bgColor(item.getBgColor())
                .groupId(item.getGroup().getId())
                .custom(item.getUser() != null)
                .build();
    }
}
