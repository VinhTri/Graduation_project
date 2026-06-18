package com.project.app.category.service;

import com.project.app.category.dto.request.CategoryGroupRequest;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.entity.CategoryGroup;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryGroupRepository;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.user.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryGroupRepository groupRepository;
    private final CategoryItemRepository itemRepository;

    @PostConstruct
    @Transactional
    public void seedDefaultCategories() {
        if (!groupRepository.existsByUserIsNull()) {
            // Group 1: Chi tiêu - sinh hoạt
            CategoryGroup chiTieu = groupRepository.save(CategoryGroup.builder()
                    .title("Chi tiêu - sinh hoạt")
                    .icon("cart-outline")
                    .color("#F97316")
                    .bgColor("#FFEDD5")
                    .build());
            
            itemRepository.save(CategoryItem.builder().label("Ăn uống").icon("fast-food-outline").color("#F97316").bgColor("#FFEDD5").group(chiTieu).build());
            itemRepository.save(CategoryItem.builder().label("Chợ, siêu thị").icon("basket-outline").color("#F97316").bgColor("#FFEDD5").group(chiTieu).build());
            itemRepository.save(CategoryItem.builder().label("Cà phê").icon("cafe-outline").color("#F97316").bgColor("#FFEDD5").group(chiTieu).build());

            // Group 2: Chi phí phát sinh
            CategoryGroup phatSinh = groupRepository.save(CategoryGroup.builder()
                    .title("Chi phí phát sinh")
                    .icon("flash-outline")
                    .color("#3B82F6")
                    .bgColor("#DBEAFE")
                    .build());
            
            itemRepository.save(CategoryItem.builder().label("Di chuyển").icon("car-outline").color("#3B82F6").bgColor("#DBEAFE").group(phatSinh).build());
            itemRepository.save(CategoryItem.builder().label("Mua sắm").icon("shirt-outline").color("#3B82F6").bgColor("#DBEAFE").group(phatSinh).build());
            itemRepository.save(CategoryItem.builder().label("Giải trí").icon("game-controller-outline").color("#3B82F6").bgColor("#DBEAFE").group(phatSinh).build());

            // Group 3: Chi phí cố định
            CategoryGroup coDinh = groupRepository.save(CategoryGroup.builder()
                    .title("Chi phí cố định")
                    .icon("calendar-outline")
                    .color("#EF4444")
                    .bgColor("#FEE2E2")
                    .build());

            itemRepository.save(CategoryItem.builder().label("Tiền điện").icon("bulb-outline").color("#EF4444").bgColor("#FEE2E2").group(coDinh).build());
            itemRepository.save(CategoryItem.builder().label("Tiền nước").icon("water-outline").color("#EF4444").bgColor("#FEE2E2").group(coDinh).build());
            itemRepository.save(CategoryItem.builder().label("Tiền thuê nhà").icon("home-outline").color("#EF4444").bgColor("#FEE2E2").group(coDinh).build());

            // Group 4: Đầu tư - tiết kiệm
            CategoryGroup dauTu = groupRepository.save(CategoryGroup.builder()
                    .title("Đầu tư - tiết kiệm")
                    .icon("trending-up-outline")
                    .color("#10B981")
                    .bgColor("#D1FAE5")
                    .build());

            itemRepository.save(CategoryItem.builder().label("Gửi tiết kiệm").icon("wallet-outline").color("#10B981").bgColor("#D1FAE5").group(dauTu).build());
            itemRepository.save(CategoryItem.builder().label("Mua vàng").icon("stop-circle-outline").color("#10B981").bgColor("#D1FAE5").group(dauTu).build());
        }
    }

    public List<CategoryGroupResponse> getCategoriesForUser(User user) {
        List<CategoryGroup> groups = groupRepository.findByUserOrDefault(user);
        return groups.stream().map(this::mapToGroupResponse).collect(Collectors.toList());
    }

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

    public CategoryItemResponse createItem(User user, CategoryItemRequest request) {
        CategoryGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

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

    private CategoryGroupResponse mapToGroupResponse(CategoryGroup group) {
        return CategoryGroupResponse.builder()
                .id(group.getId().toString())
                .title(group.getTitle())
                .icon(group.getIcon())
                .color(group.getColor())
                .bgColor(group.getBgColor())
                .items(group.getItems() != null ? group.getItems().stream()
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
                .build();
    }
}
