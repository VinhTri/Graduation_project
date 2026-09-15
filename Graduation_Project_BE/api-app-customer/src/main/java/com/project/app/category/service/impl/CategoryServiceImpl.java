package com.project.app.category.service.impl;

import com.project.app.budget.service.BudgetService;
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
import com.project.app.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private static final int MAX_GROUPS_PER_USER = 6;
    private static final int MAX_ITEMS_PER_GROUP = 4;
    private static final int MAX_GROUP_TITLE_LENGTH = 24;
    private static final int MAX_ITEM_LABEL_LENGTH = 20;

    private final CategoryGroupRepository groupRepository;
    private final CategoryItemRepository itemRepository;
    private final UserRepository userRepository;
    private final BudgetService budgetService;

    public CategoryServiceImpl(
            CategoryGroupRepository groupRepository,
            CategoryItemRepository itemRepository,
            UserRepository userRepository,
            @Lazy BudgetService budgetService) {
        this.groupRepository = groupRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.budgetService = budgetService;
    }

    @Override
    @PostConstruct
    @Transactional
    public void seedDefaultCategories() {
        CategoryGroup expenseGroup = ensureSystemGroup(
                "Chi tiêu hệ thống",
                "trending-down-outline",
                "#DC2626",
                "#FEE2E2"
        );
        CategoryGroup incomeGroup = ensureSystemGroup(
                "Thu nhập hệ thống",
                "trending-up-outline",
                "#059669",
                "#D1FAE5"
        );
        ensureSystemItem(expenseGroup, "Nạp quỹ", "briefcase-outline", "#DC2626", "#FEE2E2");
        ensureSystemItem(incomeGroup, "Rút quỹ", "wallet-outline", "#059669", "#D1FAE5");
        ensureSystemItem(expenseGroup, "Chia tiền", "people-outline", "#7C3AED", "#EDE9FE");
        ensureSystemItem(incomeGroup, "Chia tiền", "people-outline", "#7C3AED", "#EDE9FE");
        ensureSystemItem(expenseGroup, "Chuyển tiền", "swap-horizontal-outline", "#2563EB", "#DBEAFE");
        ensureSystemItem(incomeGroup, "Nhận chuyển tiền", "swap-horizontal-outline", "#059669", "#D1FAE5");
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryGroupResponse> getCategoriesForUser(Long userId) {
        User user = requireUser(userId);
        return groupRepository.findByUserAndIsDeletedFalseOrderByIdAsc(user).stream()
                .map(CategoryGroupResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public CategoryGroupResponse createGroup(Long userId, CategoryGroupRequest request) {
        User user = requireUser(userId);

        if (groupRepository.countByUserAndIsDeletedFalse(user) >= MAX_GROUPS_PER_USER) {
            throw new AppException(ErrorCode.CATEGORY_GROUP_LIMIT_EXCEEDED);
        }

        String title = trimRequired(request.getTitle(), ErrorCode.CATEGORY_GROUP_NAME_REQUIRED);
        if (title.length() > MAX_GROUP_TITLE_LENGTH) {
            throw new AppException(ErrorCode.CATEGORY_GROUP_NAME_TOO_LONG);
        }

        String color = defaultIfBlank(request.getColor(), "#64748B");
        if (groupRepository.existsByUserAndColorIgnoreCaseAndIsDeletedFalse(user, color)) {
            throw new AppException(ErrorCode.CATEGORY_GROUP_COLOR_TAKEN);
        }

        CategoryGroup group = CategoryGroup.builder()
                .title(title)
                .icon(defaultIfBlank(request.getIcon(), "apps"))
                .color(color)
                .bgColor(defaultIfBlank(request.getBgColor(), "#F1F5F9"))
                .user(user)
                .isDeleted(false)
                .build();

        return CategoryGroupResponse.from(groupRepository.save(group));
    }

    @Override
    @Transactional
    public CategoryItemResponse createItem(Long userId, CategoryItemRequest request) {
        User user = requireUser(userId);
        CategoryGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND));

        validateGroupOwnership(group, userId);
        if (group.isDeleted()) {
            throw new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND);
        }

        long activeItems = group.getItems() == null
                ? 0
                : group.getItems().stream().filter(item -> !item.isDeleted()).count();
        if (activeItems >= MAX_ITEMS_PER_GROUP) {
            throw new AppException(ErrorCode.CATEGORY_ITEM_LIMIT_EXCEEDED);
        }

        String label = trimRequired(request.getLabel(), ErrorCode.CATEGORY_ITEM_NAME_REQUIRED);
        if (label.length() > MAX_ITEM_LABEL_LENGTH) {
            throw new AppException(ErrorCode.CATEGORY_ITEM_NAME_TOO_LONG);
        }

        String color = defaultIfBlank(request.getColor(), "#6B7280");
        if (itemRepository.existsByUserAndColorIgnoreCaseAndIsDeletedFalse(user, color)) {
            throw new AppException(ErrorCode.CATEGORY_ITEM_COLOR_TAKEN);
        }

        CategoryItem item = CategoryItem.builder()
                .label(label)
                .icon(defaultIfBlank(request.getIcon(), "ellipse-outline"))
                .color(color)
                .bgColor(defaultIfBlank(request.getBgColor(), "#F3F4F6"))
                .group(group)
                .user(user)
                .isDeleted(false)
                .build();

        return CategoryItemResponse.from(itemRepository.save(item));
    }

    @Override
    @Transactional
    public void softDeleteItem(Long userId, Long itemId) {
        CategoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        if (item.getUser() == null || !item.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        if (item.isDeleted()) {
            return;
        }

        item.setDeleted(true);
        itemRepository.save(item);
        budgetService.markCategoryDeleted(userId, itemId);
    }

    @Override
    @Transactional
    public void softDeleteGroup(Long userId, Long groupId) {
        CategoryGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND));

        validateGroupOwnership(group, userId);
        if (group.isDeleted()) {
            return;
        }

        List<Long> deletedItemIds = List.of();
        if (group.getItems() != null) {
            deletedItemIds = group.getItems().stream()
                    .filter(item -> !item.isDeleted())
                    .peek(item -> item.setDeleted(true))
                    .map(CategoryItem::getId)
                    .toList();
        }

        group.setDeleted(true);
        groupRepository.save(group);
        budgetService.markCategoriesDeleted(userId, deletedItemIds);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryItem requireUserOwnedItem(Long userId, Long itemId) {
        CategoryItem item = itemRepository.findByIdAndIsDeletedFalse(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_INVALID_FOR_NOTEBOOK));

        if (item.getUser() == null || !item.getUser().getId().equals(userId) || item.isDeleted()) {
            throw new AppException(ErrorCode.CATEGORY_INVALID_FOR_NOTEBOOK);
        }

        return item;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CategoryItem> findActiveItem(Long itemId) {
        if (itemId == null) {
            return Optional.empty();
        }
        return itemRepository.findByIdAndIsDeletedFalse(itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CategoryItem> findItemIncludingDeleted(Long itemId) {
        if (itemId == null) {
            return Optional.empty();
        }
        return itemRepository.findById(itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, CategoryItem> findItemsByIdsIncludingDeleted(Collection<Long> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            return Map.of();
        }
        return itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(CategoryItem::getId, item -> item, (a, b) -> a));
    }

    private CategoryGroup ensureSystemGroup(String title, String icon, String color, String bgColor) {
        return groupRepository.findFirstByTitleAndUserIsNullAndIsDeletedFalse(title)
                .orElseGet(() -> groupRepository.save(CategoryGroup.builder()
                        .title(title)
                        .icon(icon)
                        .color(color)
                        .bgColor(bgColor)
                        .user(null)
                        .isDeleted(false)
                        .build()));
    }

    private void ensureSystemItem(
            CategoryGroup group, String label, String icon, String color, String bgColor) {
        itemRepository.findFirstByLabelAndGroup_IdAndUserIsNullAndIsDeletedFalse(label, group.getId())
                .orElseGet(() -> itemRepository.save(CategoryItem.builder()
                        .label(label)
                        .icon(icon)
                        .color(color)
                        .bgColor(bgColor)
                        .group(group)
                        .user(null)
                        .isDeleted(false)
                        .build()));
    }

    private void validateGroupOwnership(CategoryGroup group, Long userId) {
        if (group.getUser() == null || !group.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private String trimRequired(String value, ErrorCode emptyCode) {
        if (value == null || value.trim().isEmpty()) {
            throw new AppException(emptyCode);
        }
        return value.trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        return value.trim();
    }
}
