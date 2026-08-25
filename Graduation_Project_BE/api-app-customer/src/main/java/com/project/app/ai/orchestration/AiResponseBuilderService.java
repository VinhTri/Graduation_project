package com.project.app.ai.orchestration;

import com.project.app.ai.dto.response.AiActionDto;
import com.project.app.ai.dto.response.AiCardDto;
import com.project.app.ai.dto.response.AiCardItemDto;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.tool.dto.ToolResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiResponseBuilderService {

    public AiChatResponse build(String text, String moduleType, ToolResultDto toolResult) {
        return build(text, moduleType, toolResult, null, null);
    }

    public AiChatResponse build(
            String text,
            String moduleType,
            ToolResultDto toolResult,
            List<AiCardDto> explicitCards,
            List<AiActionDto> actions) {

        List<AiCardDto> cards = new ArrayList<>();
        if (explicitCards != null && !explicitCards.isEmpty()) {
            cards.addAll(explicitCards);
        } else if (toolResult != null && toolResult.isSuccess()) {
            AiCardDto card = buildCard(toolResult);
            if (card != null) {
                cards.add(card);
            }
        }

        return AiChatResponse.builder()
                .id(UUID.randomUUID().toString())
                .text(text)
                .moduleType(moduleType)
                .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                .cards(cards.isEmpty() ? null : cards)
                .actions(actions == null || actions.isEmpty() ? null : actions)
                .build();
    }

    public String buildListCategoriesText(ToolResultDto toolResult) {
        return buildCategoriesText(toolResult, CategoryTextStyle.INVENTORY);
    }

    public String buildSpendingTypesText(ToolResultDto toolResult) {
        return buildCategoriesText(toolResult, CategoryTextStyle.SPENDING_TYPES);
    }

    public String buildIncomeTypesText(ToolResultDto toolResult) {
        return buildCategoriesText(toolResult, CategoryTextStyle.INCOME_TYPES);
    }

    private enum CategoryTextStyle {
        INVENTORY,
        SPENDING_TYPES,
        INCOME_TYPES
    }

    private String buildCategoriesText(ToolResultDto toolResult, CategoryTextStyle style) {
        if (toolResult == null || !toolResult.isSuccess() || toolResult.getData() == null) {
            return "Không lấy được danh sách danh mục. Bạn thử lại sau nhé.";
        }

        Map<String, Object> data = toolResult.getData();
        int groupCount = intValue(data.get("groupCount"));
        int itemCount = intValue(data.get("itemCount"));
        int remainingGroups = intValue(data.get("remainingGroups"));
        int maxGroups = intValue(data.get("maxGroups"));
        int maxItemsPerGroup = intValue(data.get("maxItemsPerGroup"));

        if (groupCount == 0) {
            if (style == CategoryTextStyle.SPENDING_TYPES) {
                return "Bạn chưa tạo danh mục chi tiêu nào. Vào mục Danh mục trên app để thêm (ví dụ: Ăn uống, Di chuyển, Giải trí) rồi gán vào từng giao dịch.";
            }
            if (style == CategoryTextStyle.INCOME_TYPES) {
                return "Bạn chưa tạo nhóm danh mục thu nhập nào. Vào mục Danh mục để tạo nhóm Thu nhập và thêm các nguồn như Lương, Thưởng hoặc Kinh doanh.";
            }
            return "Bạn chưa tạo danh mục nào. Vào mục Danh mục trên app để thêm nhóm và danh mục chi tiêu. "
                    + "Mỗi tài khoản có thể tạo tối đa " + maxGroups + " nhóm, mỗi nhóm tối đa "
                    + maxItemsPerGroup + " danh mục.";
        }

        if (style == CategoryTextStyle.SPENDING_TYPES) {
            String names = joinCategoryNames(data);
            if (names.isBlank()) {
                return "Bạn đã có " + groupCount + " nhóm danh mục nhưng chưa có danh mục con. Hãy thêm danh mục trong app để phân loại chi tiêu.";
            }
            return "Các loại chi tiêu bạn đang dùng: " + names + ". "
                    + "Chi tiết từng nhóm xem ở bảng bên dưới.";
        }
        if (style == CategoryTextStyle.INCOME_TYPES) {
            String names = joinCategoryNames(data);
            if (names.isBlank()) return "Bạn chưa có danh mục thu nhập nào.";
            return "Các danh mục thu nhập bạn đang có: " + names + ". Chi tiết xem ở bảng bên dưới.";
        }

        return String.format(
                "Bạn đang có %d nhóm danh mục với tổng %d danh mục con. "
                        + "Còn tạo thêm được %d nhóm nữa (tối đa %d nhóm, %d danh mục/nhóm).",
                groupCount, itemCount, remainingGroups, maxGroups, maxItemsPerGroup);
    }

    @SuppressWarnings("unchecked")
    private String joinCategoryNames(Map<String, Object> data) {
        Object groupsObj = data.get("groups");
        if (!(groupsObj instanceof List<?> groups)) {
            return "";
        }

        List<String> names = new ArrayList<>();
        for (Object groupObj : groups) {
            if (!(groupObj instanceof Map<?, ?> group)) {
                continue;
            }
            Object itemsObj = group.get("items");
            if (!(itemsObj instanceof List<?> groupItems)) {
                continue;
            }
            for (Object itemObj : groupItems) {
                if (!(itemObj instanceof Map<?, ?> item)) {
                    continue;
                }
                String label = stringValue(item.get("label"));
                if (!label.isBlank()) {
                    names.add(label);
                }
            }
        }
        return String.join(", ", names);
    }

    public String buildCategoryGuideText() {
        return """
                Danh mục giúp bạn phân loại thu chi (Ăn uống, Di chuyển, Lương...).

                Trong app SmartSpend:
                • Vào mục Danh mục để xem, tạo nhóm và danh mục con.
                • Mỗi tài khoản tối đa 6 nhóm, mỗi nhóm tối đa 4 danh mục.
                • Giao dịch sổ tay bắt buộc chọn danh mục.
                • Hiện chưa hỗ trợ sửa trực tiếp — muốn đổi tên thì xóa và tạo lại.

                Bạn có thể hỏi "danh mục của tôi" để xem danh sách, hoặc "tôi có những loại chi tiêu nào" để xem các khoản đang dùng.""";
    }

    @SuppressWarnings("unchecked")
    private AiCardDto buildCard(ToolResultDto toolResult) {
        if (!"list_user_categories".equals(toolResult.getToolName())) {
            return null;
        }

        Map<String, Object> data = toolResult.getData();
        if (data == null) {
            return null;
        }

        List<AiCardItemDto> items = new ArrayList<>();
        Object groupsObj = data.get("groups");
        if (groupsObj instanceof List<?> groups) {
            for (Object groupObj : groups) {
                if (!(groupObj instanceof Map<?, ?> group)) {
                    continue;
                }
                String groupTitle = stringValue(group.get("title"));
                Object itemsObj = group.get("items");
                if (!(itemsObj instanceof List<?> groupItems)) {
                    continue;
                }
                for (Object itemObj : groupItems) {
                    if (!(itemObj instanceof Map<?, ?> item)) {
                        continue;
                    }
                    items.add(AiCardItemDto.builder()
                            .label(stringValue(item.get("label")))
                            .value(groupTitle)
                            .color(stringValue(item.get("color")))
                            .build());
                }
            }
        }

        if (items.isEmpty()) {
            return null;
        }

        return AiCardDto.builder()
                .type("CATEGORY_LIST")
                .title(cardTitle(toolResult))
                .items(items)
                .build();
    }

    private String cardTitle(ToolResultDto toolResult) {
        Object style = toolResult.getData() != null ? toolResult.getData().get("responseStyle") : null;
        if ("SPENDING_TYPES".equals(style)) {
            return "Loại chi tiêu của bạn";
        }
        if ("INCOME_TYPES".equals(style)) {
            return "Danh mục thu nhập của bạn";
        }
        return "Danh mục của bạn";
    }

    private int intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : "";
    }
}
