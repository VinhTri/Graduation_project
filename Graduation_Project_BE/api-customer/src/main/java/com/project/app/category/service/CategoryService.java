package com.project.app.category.service;

import com.project.app.category.dto.request.CategoryGroupRequest;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface CategoryService {
    void seedDefaultCategories();
    List<CategoryGroupResponse> getCategoriesForUser(User user);
    CategoryGroupResponse createGroup(User user, CategoryGroupRequest request);
    CategoryItemResponse createItem(User user, CategoryItemRequest request);
    void softDeleteCategoryItem(Long itemId, User user);
    CategoryItemResponse updateCategoryItem(Long itemId, User user, CategoryItemRequest request);
}
