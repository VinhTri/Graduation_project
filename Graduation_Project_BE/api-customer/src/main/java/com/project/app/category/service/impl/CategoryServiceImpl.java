package com.project.app.category.service.impl;

import com.project.app.category.dto.request.CategoryGroupRequest;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.entity.CategoryGroup;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryGroupRepository;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.category.service.CategoryService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.user.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private static final int MAX_GROUPS_PER_USER = 5;
    private static final int MAX_ITEMS_PER_GROUP = 4;

    private final CategoryGroupRepository groupRepository;
    private final CategoryItemRepository itemRepository;

    @Override
    @PostConstruct
    @Transactional
    public void seedDefaultCategories() {
        List<CategoryGroup> defaultGroups = groupRepository.findByUserIsNull();
        if (!defaultGroups.isEmpty()) {
            groupRepository.deleteAll(defaultGroups);
        }
    }

    @Override
    public List<CategoryGroupResponse> getCategoriesForUser(User user) {
        List<CategoryGroup> groups = groupRepository.findByUserAndIsDeletedFalseOrderByIdAsc(user);
        return groups.stream().map(this::mapToGroupResponse).collect(Collectors.toList());
    }

    @Override
    public CategoryGroupResponse createGroup(User user, CategoryGroupRequest request) {
        if (groupRepository.countByUserAndIsDeletedFalse(user) >= MAX_GROUPS_PER_USER) {
            throw new AppException(ErrorCode.CATEGORY_GROUP_LIMIT_EXCEEDED);
        }

        CategoryGroup group = CategoryGroup.builder()
                .title(request.getTitle())
                .icon(request.getIcon())
                .color(request.getColor())
                .bgColor(request.getBgColor())
                .user(user)
                .build();
        group = groupRepository.save(group);
        return mapToGroupResponse(group);
    }

    @Override
    public CategoryItemResponse createItem(User user, CategoryItemRequest request) {
        CategoryGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND));

        validateGroupOwnership(group, user);

        if (group.isDeleted()) {
            throw new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND);
        }

        long activeItemsCount = group.getItems() != null ?
                group.getItems().stream().filter(item -> !item.isDeleted()).count() : 0;

        if (activeItemsCount >= MAX_ITEMS_PER_GROUP) {
            throw new AppException(ErrorCode.CATEGORY_ITEM_LIMIT_EXCEEDED);
        }

        CategoryItem item = CategoryItem.builder()
                .label(request.getLabel())
                .icon(request.getIcon())
                .color(request.getColor())
                .bgColor(request.getBgColor())
                .group(group)
                .user(user)
                .build();
        item = itemRepository.save(item);
        return mapToItemResponse(item);
    }

    @Override
    public void softDeleteCategoryItem(Long itemId, User user) {
        CategoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        if (item.getUser() == null || !item.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        item.setDeleted(true);
        itemRepository.save(item);
    }

    @Override
    public CategoryItemResponse updateCategoryItem(Long itemId, User user, CategoryItemRequest request) {
        throw new AppException(ErrorCode.CATEGORY_ITEM_NOT_EDITABLE);
    }

    @Override
    @Transactional
    public void softDeleteGroup(Long groupId, User user) {
        CategoryGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND));

        validateGroupOwnership(group, user);

        if (group.isDeleted()) {
            return;
        }

        if (group.getItems() != null) {
            for (CategoryItem item : group.getItems()) {
                if (!item.isDeleted()) {
                    item.setDeleted(true);
                }
            }
        }

        group.setDeleted(true);
        groupRepository.save(group);
    }

    private void validateGroupOwnership(CategoryGroup group, User user) {
        if (group.getUser() == null || !group.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
    }

    private CategoryGroupResponse mapToGroupResponse(CategoryGroup group) {
        return CategoryGroupResponse.builder()
                .id(group.getId().toString())
                .title(group.getTitle())
                .icon(group.getIcon())
                .color(group.getColor())
                .bgColor(group.getBgColor())
                .items(group.getItems() != null ? group.getItems().stream()
                        .filter(item -> !item.isDeleted())
                        .map(this::mapToItemResponse)
                        .collect(Collectors.toList()) : List.of())
                .build();
    }

    private CategoryItemResponse mapToItemResponse(CategoryItem item) {
        return CategoryItemResponse.builder()
                .id(item.getId().toString())
                .label(item.getLabel())
                .icon(item.getIcon())
                .color(item.getColor())
                .bgColor(item.getBgColor())
                .groupId(item.getGroup().getId().toString())
                .isCustom(item.getUser() != null)
                .build();
    }
}
