package com.project.app.category.service;

import com.project.app.category.dto.request.CategoryGroupRequest;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.entity.CategoryItem;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CategoryService {

    void seedDefaultCategories();

    List<CategoryGroupResponse> getCategoriesForUser(Long userId);

    CategoryGroupResponse createGroup(Long userId, CategoryGroupRequest request);

    CategoryItemResponse createItem(Long userId, CategoryItemRequest request);

    void softDeleteItem(Long userId, Long itemId);

    void softDeleteGroup(Long userId, Long groupId);

    /** Danh mục user sở hữu, còn hiệu lực — dùng cho sổ tay / ngân sách. */
    CategoryItem requireUserOwnedItem(Long userId, Long itemId);

    Optional<CategoryItem> findActiveItem(Long itemId);

    Optional<CategoryItem> findItemIncludingDeleted(Long itemId);

    Map<Long, CategoryItem> findItemsByIdsIncludingDeleted(Collection<Long> itemIds);
}
