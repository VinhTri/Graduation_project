package com.project.app.ai.category;

import com.project.app.ai.dto.response.AiActionDto;
import com.project.app.ai.dto.response.AiCardDto;
import com.project.app.ai.dto.response.AiCardItemDto;
import com.project.app.category.dto.request.CategoryItemRequest;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import com.project.app.common.exception.AppException;
import com.project.app.user.entity.User;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CategoryCreateService {

    private static final Pattern CREATE_PATTERN = Pattern.compile(
            "(?i)(?:tạo|tao|thêm|them)\\s+(?:danh\\s*mục|danh\\s*muc)\\s+(.+?)(?:\\s+(?:trong|vào|vao)\\s+(?:nhóm|nhom)\\s+(.+))?$"
                    + "|(?i)(?:tạo|tao|thêm|them)\\s+(.+?)\\s+(?:trong|vào|vao)\\s+(?:nhóm|nhom)\\s+(.+)"
    );

    private static final Pattern CONFIRM_PATTERN = Pattern.compile(
            "(?i)^(ok|oke|đồng ý|dong y|xác nhận|xac nhan|tạo đi|tao di|yes|y|đúng|dung|làm đi|lam di)$"
    );

    private static final Pattern CANCEL_PATTERN = Pattern.compile(
            "(?i)^(hủy|huy|thôi|thoi|không|khong|bo qua|bỏ qua|cancel)$"
    );

    private final CategoryService categoryService;
    private final CategoryThemeService themeService;
    private final CategoryCreateSessionStore sessionStore;

    public Optional<CategoryCreateResult> handle(User user, String message) {
        if (user == null || user.getId() == null || message == null || message.isBlank()) {
            return Optional.empty();
        }

        String trimmed = message.trim();
        Long userId = user.getId();

        if (CANCEL_PATTERN.matcher(normalize(trimmed)).find()) {
            if (sessionStore.get(userId).isPresent()) {
                sessionStore.clear(userId);
                return Optional.of(CategoryCreateResult.builder()
                        .text("Đã hủy tạo danh mục. Bạn có thể bắt đầu lại bất cứ lúc nào.")
                        .moduleType("CATEGORY")
                        .build());
            }
            return Optional.empty();
        }

        if (CONFIRM_PATTERN.matcher(normalize(trimmed)).find()) {
            return sessionStore.get(userId)
                    .map(draft -> confirmCreate(userId, draft));
        }

        Optional<CategoryCreateDraft> pending = sessionStore.get(userId);
        if (pending.isPresent() && isThemeAdjustment(trimmed)) {
            return Optional.of(updateDraftTheme(userId, pending.get(), trimmed));
        }

        if (isCreateRequest(trimmed)) {
            return Optional.of(proposeCreate(userId, trimmed));
        }

        return Optional.empty();
    }

    private CategoryCreateResult proposeCreate(Long userId, String message) {
        ParsedCreate parsed = parseCreateMessage(message);
        if (parsed.label() == null || parsed.label().isBlank()) {
            return CategoryCreateResult.builder()
                    .text("Bạn muốn tạo danh mục tên gì? Ví dụ: \"Tạo danh mục Gym\".")
                    .moduleType("CATEGORY")
                    .build();
        }

        if (parsed.label().length() > 20) {
            return CategoryCreateResult.builder()
                    .text("Tên danh mục tối đa 20 ký tự. Bạn rút gọn lại nhé.")
                    .moduleType("CATEGORY")
                    .build();
        }

        CategoryThemeService.GroupSlot group = themeService.findGroupForNewItem(userId, parsed.groupHint());
        if (group == null) {
            return CategoryCreateResult.builder()
                    .text("Bạn chưa có nhóm danh mục nào. Vào mục Danh mục trên app để tạo nhóm trước, hoặc bấm \"Chọn icon & màu\" bên dưới.")
                    .moduleType("CATEGORY")
                    .actions(List.of(openPickerAction(parsed.label(), null)))
                    .build();
        }

        if (group.itemCount() >= 4) {
            return CategoryCreateResult.builder()
                    .text("Nhóm \"" + group.groupTitle() + "\" đã đủ 4 danh mục. Hãy chọn nhóm khác hoặc xóa bớt danh mục cũ.")
                    .moduleType("CATEGORY")
                    .build();
        }

        CategoryThemeService.ThemeSuggestion theme = themeService.suggestTheme(userId, parsed.label());
        if (theme.availableIcons().isEmpty()) {
            return CategoryCreateResult.builder()
                    .text("Không còn icon trống để tạo danh mục mới. Hãy xóa danh mục cũ hoặc dùng \"Chọn icon & màu\" trên màn Danh mục.")
                    .moduleType("CATEGORY")
                    .actions(List.of(openPickerAction(parsed.label(), group.groupId())))
                    .build();
        }
        if (theme.availableColors().isEmpty()) {
            return CategoryCreateResult.builder()
                    .text("Không còn màu trống để tạo danh mục mới. Hãy xóa danh mục cũ hoặc dùng \"Chọn icon & màu\" trên màn Danh mục.")
                    .moduleType("CATEGORY")
                    .actions(List.of(openPickerAction(parsed.label(), group.groupId())))
                    .build();
        }

        CategoryCreateDraft draft = CategoryCreateDraft.builder()
                .label(parsed.label().trim())
                .groupId(group.groupId())
                .groupTitle(group.groupTitle())
                .icon(theme.icon())
                .color(theme.color())
                .bgColor(theme.bgColor())
                .build();
        sessionStore.save(userId, draft);

        return buildPreviewResult(userId, draft, theme, true);
    }

    private CategoryCreateResult updateDraftTheme(Long userId, CategoryCreateDraft draft, String message) {
        CategoryThemeService.ThemeSuggestion theme = themeService.suggestTheme(userId, draft.getLabel());

        String icon = themeService.resolveIconChoice(theme.availableIcons(), draft.getIcon(), message);
        CategoryThemeCatalog.ColorTheme colorTheme = themeService.resolveColorChoice(
                theme.availableColors(), draft.getColor(), message);

        draft.setIcon(icon);
        draft.setColor(colorTheme.getColor());
        draft.setBgColor(colorTheme.getBgColor());
        sessionStore.save(userId, draft);

        CategoryThemeService.ThemeSuggestion updatedTheme = new CategoryThemeService.ThemeSuggestion(
                icon, colorTheme.getColor(), colorTheme.getBgColor(),
                theme.availableIcons(), theme.availableColors());

        return buildPreviewResult(userId, draft, updatedTheme, false);
    }

    private CategoryCreateResult confirmCreate(Long userId, CategoryCreateDraft draft) {
        try {
            CategoryItemRequest request = new CategoryItemRequest();
            request.setGroupId(draft.getGroupId());
            request.setLabel(draft.getLabel());
            request.setIcon(draft.getIcon());
            request.setColor(draft.getColor());
            request.setBgColor(draft.getBgColor());

            CategoryItemResponse created = categoryService.createItem(userId, request);
            sessionStore.clear(userId);

            return CategoryCreateResult.builder()
                    .text("Đã tạo danh mục " + created.getLabel() + " trong nhóm "
                            + draft.getGroupTitle() + " (icon " + created.getIcon() + ").")
                    .moduleType("CATEGORY")
                    .cards(List.of(AiCardDto.builder()
                            .type("CATEGORY_PREVIEW")
                            .title("Danh mục mới")
                            .items(List.of(
                                    AiCardItemDto.builder().label("Tên").value(created.getLabel()).color(created.getColor()).build(),
                                    AiCardItemDto.builder().label("Nhóm").value(draft.getGroupTitle()).color(created.getColor()).build(),
                                    AiCardItemDto.builder().label("Icon").value(created.getIcon()).color(created.getColor()).build()
                            ))
                            .build()))
                    .build();
        } catch (AppException ex) {
            return CategoryCreateResult.builder()
                    .text("Không tạo được danh mục: " + ex.getMessage()
                            + ". Bạn có thể bấm \"Chọn icon & màu\" để chọn trực tiếp trên app.")
                    .moduleType("CATEGORY")
                    .actions(List.of(openPickerAction(draft.getLabel(), draft.getGroupId())))
                    .build();
        }
    }

    private CategoryCreateResult buildPreviewResult(
            Long userId,
            CategoryCreateDraft draft,
            CategoryThemeService.ThemeSuggestion theme,
            boolean includeIntro) {

        List<CategoryThemeService.ThemeOption> iconOptions =
                themeService.buildIconOptions(theme.availableIcons(), draft.getIcon(), 5);
        List<CategoryThemeService.ThemeOption> colorOptions =
                themeService.buildColorOptions(theme.availableColors(), draft.getColor(), 5);

        StringBuilder text = new StringBuilder();
        if (includeIntro) {
            text.append("Tôi gợi ý tạo danh mục ").append(draft.getLabel());
        } else {
            text.append("Đã cập nhật gợi ý cho danh mục ").append(draft.getLabel());
        }
        text.append(" trong nhóm ").append(draft.getGroupTitle())
                .append(" với icon ").append(draft.getIcon())
                .append(" và màu ").append(draft.getColor()).append(".\n\n")
                .append("Gõ OK để tạo, hoặc chọn lại:\n");

        appendOptions(text, "Icon", iconOptions);
        text.append("\n");
        appendOptions(text, "Màu", colorOptions);
        text.append("\n\nBạn cũng có thể bấm Chọn icon & màu để mở màn hình Danh mục.");

        return CategoryCreateResult.builder()
                .text(text.toString())
                .moduleType("CATEGORY")
                .cards(List.of(AiCardDto.builder()
                        .type("CATEGORY_PREVIEW")
                        .title("Xem trước danh mục")
                        .items(List.of(
                                AiCardItemDto.builder().label("Tên").value(draft.getLabel()).color(draft.getColor()).build(),
                                AiCardItemDto.builder().label("Nhóm").value(draft.getGroupTitle()).color(draft.getColor()).build(),
                                AiCardItemDto.builder().label("Icon").value(draft.getIcon()).color(draft.getColor()).build(),
                                AiCardItemDto.builder().label("Màu").value(draft.getColor()).color(draft.getColor()).build()
                        ))
                        .build()))
                .actions(List.of(
                        AiActionDto.builder()
                                .id("confirm_create_category")
                                .label("Xác nhận tạo")
                                .type("SEND_MESSAGE")
                                .payload("OK")
                                .build(),
                        openPickerAction(draft.getLabel(), draft.getGroupId())
                ))
                .build();
    }

    private void appendOptions(StringBuilder text, String title, List<CategoryThemeService.ThemeOption> options) {
        text.append(title).append(": ");
        for (int i = 0; i < options.size(); i++) {
            CategoryThemeService.ThemeOption option = options.get(i);
            if (i > 0) {
                text.append(" · ");
            }
            text.append(option.index()).append(") ").append(option.value());
            if (option.selected()) {
                text.append(" ✓");
            }
        }
    }

    private AiActionDto openPickerAction(String label, Long groupId) {
        StringBuilder payload = new StringBuilder("openCreate=1");
        if (label != null && !label.isBlank()) {
            payload.append("&prefillLabel=").append(urlEncode(label));
        }
        if (groupId != null) {
            payload.append("&groupId=").append(groupId);
        }
        return AiActionDto.builder()
                .id("open_category_picker")
                .label("Chọn icon & màu")
                .type("NAVIGATE")
                .route("/categories")
                .payload(payload.toString())
                .build();
    }

    private String urlEncode(String value) {
        return value == null ? "" : value.replace(" ", "%20");
    }

    private boolean isCreateRequest(String message) {
        String n = normalize(message);
        if (n.contains("o dau") || n.contains("nhu the nao") || n.contains("lam sao")
                || n.contains("huong dan") || n.contains("cach tao")) {
            return false;
        }
        return n.contains("tao danh muc") || n.contains("them danh muc")
                || CREATE_PATTERN.matcher(message).find();
    }

    private boolean isThemeAdjustment(String message) {
        String n = normalize(message);
        return n.contains("icon") || n.contains("mau") || n.contains("color")
                || n.matches(".*\\d+.*");
    }

    private ParsedCreate parseCreateMessage(String message) {
        Matcher matcher = CREATE_PATTERN.matcher(message.trim());
        if (matcher.find()) {
            String label = firstNonBlank(matcher.group(1), matcher.group(3));
            String group = firstNonBlank(matcher.group(2), matcher.group(4));
            if (label != null) {
                label = label.replaceAll("(?i)\\s+(trong|vào|vao)\\s+(nhóm|nhom)\\s+.*$", "").trim();
            }
            return new ParsedCreate(label, group);
        }

        String n = normalize(message);
        if (n.startsWith("tao danh muc ") || n.startsWith("them danh muc ")) {
            String raw = message.trim().replaceAll("(?i)^(tạo|tao|thêm|them)\\s+(danh\\s*mục|danh\\s*muc)\\s+", "");
            raw = raw.replaceAll("(?i)\\s+(trong|vào|vao)\\s+(nhóm|nhom)\\s+.*$", "").trim();
            return new ParsedCreate(raw, null);
        }
        return new ParsedCreate(null, null);
    }

    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a.trim();
        }
        if (b != null && !b.isBlank()) {
            return b.trim();
        }
        return null;
    }

    private String normalize(String text) {
        String withoutMarks = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return withoutMarks.trim()
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("\\s+", " ");
    }

    private record ParsedCreate(String label, String groupHint) {
    }

    @Data
    @Builder
    public static class CategoryCreateResult {
        private String text;
        private String moduleType;
        private List<AiCardDto> cards;
        private List<AiActionDto> actions;
    }
}
