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

    private final CategoryGroupRepository groupRepository;
    private final CategoryItemRepository itemRepository;

    @Override
    @PostConstruct
    @Transactional
    public void seedDefaultCategories() {
        if (!groupRepository.existsByUserIsNull()) {
            // Group 1: Chi tiêu - sinh hoạt
            CategoryGroup chiTieu = CategoryGroup.builder()
                    .title("Chi tiêu - sinh hoạt")
                    .icon("cart")
                    .color("#F97316")
                    .bgColor("#FFEDD5")
                    .build();
            
            CategoryItem ct1 = CategoryItem.builder().label("Ăn uống").icon("restaurant").color("#F97316").bgColor("#FFEDD5").group(chiTieu).build();
            CategoryItem ct2 = CategoryItem.builder().label("Chợ, siêu thị").icon("bag-handle").color("#F97316").bgColor("#FFEDD5").group(chiTieu).build();
            CategoryItem ct3 = CategoryItem.builder().label("Cà phê").icon("cafe").color("#F97316").bgColor("#FFEDD5").group(chiTieu).build();
            chiTieu.getItems().addAll(java.util.Arrays.asList(ct1, ct2, ct3));
            groupRepository.save(chiTieu);

            // Group 2: Chi phí phát sinh
            CategoryGroup phatSinh = CategoryGroup.builder()
                    .title("Chi phí phát sinh")
                    .icon("flash")
                    .color("#3B82F6")
                    .bgColor("#DBEAFE")
                    .build();
            
            CategoryItem ps1 = CategoryItem.builder().label("Di chuyển").icon("car").color("#3B82F6").bgColor("#DBEAFE").group(phatSinh).build();
            CategoryItem ps2 = CategoryItem.builder().label("Mua sắm").icon("pricetag").color("#3B82F6").bgColor("#DBEAFE").group(phatSinh).build();
            CategoryItem ps3 = CategoryItem.builder().label("Giải trí").icon("game-controller").color("#3B82F6").bgColor("#DBEAFE").group(phatSinh).build();
            phatSinh.getItems().addAll(java.util.Arrays.asList(ps1, ps2, ps3));
            groupRepository.save(phatSinh);

            // Group 3: Chi phí cố định
            CategoryGroup coDinh = CategoryGroup.builder()
                    .title("Chi phí cố định")
                    .icon("calendar")
                    .color("#EF4444")
                    .bgColor("#FEE2E2")
                    .build();

            CategoryItem cd1 = CategoryItem.builder().label("Tiền điện").icon("bulb").color("#EF4444").bgColor("#FEE2E2").group(coDinh).build();
            CategoryItem cd2 = CategoryItem.builder().label("Tiền nước").icon("water").color("#EF4444").bgColor("#FEE2E2").group(coDinh).build();
            CategoryItem cd3 = CategoryItem.builder().label("Tiền thuê nhà").icon("business").color("#EF4444").bgColor("#FEE2E2").group(coDinh).build();
            coDinh.getItems().addAll(java.util.Arrays.asList(cd1, cd2, cd3));
            groupRepository.save(coDinh);

            // Group 4: Đầu tư - tiết kiệm
            CategoryGroup dauTu = CategoryGroup.builder()
                    .title("Đầu tư - tiết kiệm")
                    .icon("trending-up")
                    .color("#10B981")
                    .bgColor("#D1FAE5")
                    .build();

            CategoryItem dt1 = CategoryItem.builder().label("Gửi tiết kiệm").icon("wallet").color("#10B981").bgColor("#D1FAE5").group(dauTu).build();
            CategoryItem dt2 = CategoryItem.builder().label("Mua vàng").icon("diamond").color("#10B981").bgColor("#D1FAE5").group(dauTu).build();
            dauTu.getItems().addAll(java.util.Arrays.asList(dt1, dt2));
            groupRepository.save(dauTu);

            // Group 5: Khác
            CategoryGroup khac = CategoryGroup.builder()
                    .title("Khác")
                    .icon("cube")
                    .color("#64748B")
                    .bgColor("#F1F5F9")
                    .build();

            CategoryItem k1 = CategoryItem.builder().label("Khác").icon("apps").color("#64748B").bgColor("#F1F5F9").group(khac).build();
            CategoryItem k2 = CategoryItem.builder().label("Phí giao dịch").icon("receipt").color("#64748B").bgColor("#F1F5F9").group(khac).build();
            khac.getItems().addAll(java.util.Arrays.asList(k1, k2));
            groupRepository.save(khac);
        }
    }

    @Override
    public List<CategoryGroupResponse> getCategoriesForUser(User user) {
        List<CategoryGroup> groups = groupRepository.findByUserOrDefault(user);
        return groups.stream().map(this::mapToGroupResponse).collect(Collectors.toList());
    }

    @Override
    public CategoryGroupResponse createGroup(User user, CategoryGroupRequest request) {
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

        long activeItemsCount = group.getItems() != null ? 
                group.getItems().stream().filter(item -> !item.isDeleted()).count() : 0;
        
        if (activeItemsCount >= 8) {
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
        CategoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        if (item.getUser() == null || !item.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        CategoryGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_GROUP_NOT_FOUND));

        item.setLabel(request.getLabel());
        item.setIcon(request.getIcon());
        item.setColor(request.getColor());
        item.setBgColor(request.getBgColor());
        item.setGroup(group);

        item = itemRepository.save(item);
        return mapToItemResponse(item);
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
