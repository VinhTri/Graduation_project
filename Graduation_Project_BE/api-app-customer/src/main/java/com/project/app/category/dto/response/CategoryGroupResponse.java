package com.project.app.category.dto.response;

import com.project.app.category.entity.CategoryGroup;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CategoryGroupResponse {

    Long id;
    String title;
    String icon;
    String color;
    String bgColor;
    List<CategoryItemResponse> items;

    public static CategoryGroupResponse from(CategoryGroup group) {
        List<CategoryItemResponse> items = group.getItems() == null
                ? List.of()
                : group.getItems().stream()
                        .filter(item -> !item.isDeleted())
                        .map(CategoryItemResponse::from)
                        .toList();

        return CategoryGroupResponse.builder()
                .id(group.getId())
                .title(group.getTitle())
                .icon(group.getIcon())
                .color(group.getColor())
                .bgColor(group.getBgColor())
                .items(items)
                .build();
    }
}
