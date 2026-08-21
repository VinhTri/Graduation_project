package com.project.app.ai.tool;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ListUserCategoriesTool implements AiTool {

    static final int MAX_GROUPS_PER_USER = 6;
    static final int MAX_ITEMS_PER_GROUP = 4;

    private final CategoryService categoryService;

    @Override
    public String getName() {
        return "list_user_categories";
    }

    @Override
    public String getDescription() {
        return "Lấy danh sách nhóm và danh mục chi tiêu/thu nhập do người dùng tạo trong SmartSpend. "
                + "Dùng khi user hỏi danh mục hiện có, số lượng nhóm/danh mục, hoặc còn tạo thêm được không.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        parameters.put("properties", Collections.emptyMap());
        decl.put("parameters", parameters);
        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        if (user == null || user.getId() == null) {
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Người dùng chưa đăng nhập.")
                    .data(Collections.emptyMap())
                    .build();
        }

        List<CategoryGroupResponse> groups = categoryService.getCategoriesForUser(user.getId());
        List<Map<String, Object>> groupPayload = new ArrayList<>();
        int totalItems = 0;

        for (CategoryGroupResponse group : groups) {
            List<Map<String, Object>> itemsPayload = new ArrayList<>();
            List<CategoryItemResponse> items = group.getItems() != null ? group.getItems() : List.of();

            for (CategoryItemResponse item : items) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("id", item.getId());
                itemMap.put("label", item.getLabel());
                itemMap.put("icon", item.getIcon());
                itemMap.put("color", item.getColor());
                itemMap.put("bgColor", item.getBgColor());
                itemsPayload.add(itemMap);
            }

            totalItems += items.size();
            Map<String, Object> groupMap = new HashMap<>();
            groupMap.put("id", group.getId());
            groupMap.put("title", group.getTitle());
            groupMap.put("icon", group.getIcon());
            groupMap.put("color", group.getColor());
            groupMap.put("itemCount", items.size());
            groupMap.put("remainingItemSlots", Math.max(0, MAX_ITEMS_PER_GROUP - items.size()));
            groupMap.put("items", itemsPayload);
            groupPayload.add(groupMap);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("groupCount", groups.size());
        data.put("itemCount", totalItems);
        data.put("maxGroups", MAX_GROUPS_PER_USER);
        data.put("maxItemsPerGroup", MAX_ITEMS_PER_GROUP);
        data.put("remainingGroups", Math.max(0, MAX_GROUPS_PER_USER - groups.size()));
        data.put("groups", groupPayload);

        return ToolResultDto.builder()
                .toolName(getName())
                .success(true)
                .message(groups.isEmpty()
                        ? "Người dùng chưa có danh mục tùy chỉnh."
                        : "Đã lấy " + groups.size() + " nhóm danh mục.")
                .data(data)
                .build();
    }
}
