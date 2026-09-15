package com.project.app.ai.category;

import com.project.app.category.dto.response.CategoryGroupResponse;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CategoryThemeService {

    private static final int MAX_ITEMS_PER_GROUP = 4;

    private final CategoryService categoryService;

    public List<String> getAvailableIcons(Long userId) {
        Set<String> used = loadUsedIcons(userId);
        List<String> available = new ArrayList<>();
        for (String icon : CategoryThemeCatalog.ICONS) {
            if (!used.contains(icon.toLowerCase(Locale.ROOT))) {
                available.add(icon);
            }
        }
        return available;
    }

    public List<CategoryThemeCatalog.ColorTheme> getAvailableColors(Long userId) {
        Set<String> used = loadUsedColors(userId);
        List<CategoryThemeCatalog.ColorTheme> available = new ArrayList<>();
        for (CategoryThemeCatalog.ColorTheme theme : CategoryThemeCatalog.COLORS) {
            if (!used.contains(normalizeHex(theme.getColor()))) {
                available.add(theme);
            }
        }
        return available;
    }

    public ThemeSuggestion suggestTheme(Long userId, String label) {
        List<String> availableIcons = getAvailableIcons(userId);
        List<CategoryThemeCatalog.ColorTheme> availableColors = getAvailableColors(userId);

        String normalizedLabel = normalizeText(label);
        String hintedIcon = CategoryThemeCatalog.suggestIconForLabel(normalizedLabel);

        String icon = pickIcon(availableIcons, hintedIcon);
        CategoryThemeCatalog.ColorTheme color = availableColors.isEmpty()
                ? CategoryThemeCatalog.COLORS.get(0)
                : availableColors.get(0);

        return new ThemeSuggestion(icon, color.getColor(), color.getBgColor(), availableIcons, availableColors);
    }

    public List<ThemeOption> buildIconOptions(List<String> availableIcons, String selectedIcon, int limit) {
        List<ThemeOption> options = new ArrayList<>();
        int count = 0;
        for (String icon : availableIcons) {
            if (count >= limit) {
                break;
            }
            options.add(new ThemeOption(count + 1, icon, icon.equals(selectedIcon)));
            count++;
        }
        return options;
    }

    public List<ThemeOption> buildColorOptions(
            List<CategoryThemeCatalog.ColorTheme> availableColors,
            String selectedColor,
            int limit) {

        List<ThemeOption> options = new ArrayList<>();
        int count = 0;
        for (CategoryThemeCatalog.ColorTheme theme : availableColors) {
            if (count >= limit) {
                break;
            }
            options.add(new ThemeOption(count + 1, theme.getColor(), theme.getColor().equalsIgnoreCase(selectedColor)));
            count++;
        }
        return options;
    }

    public String resolveIconChoice(List<String> availableIcons, String currentIcon, String message) {
        Integer index = parseOptionIndex(message, "icon");
        if (index != null && index >= 1 && index <= availableIcons.size()) {
            return availableIcons.get(index - 1);
        }
        return currentIcon;
    }

    public CategoryThemeCatalog.ColorTheme resolveColorChoice(
            List<CategoryThemeCatalog.ColorTheme> availableColors,
            String currentColor,
            String message) {

        Integer index = parseOptionIndex(message, "mau");
        if (index == null) {
            index = parseOptionIndex(message, "color");
        }
        if (index != null && index >= 1 && index <= availableColors.size()) {
            return availableColors.get(index - 1);
        }

        String normalized = normalizeText(message);
        for (CategoryThemeCatalog.ColorTheme theme : availableColors) {
            if (normalized.contains("cam") && theme.getColor().equalsIgnoreCase("#F59E0B")) {
                return theme;
            }
            if (normalized.contains("do") && theme.getColor().equalsIgnoreCase("#EF4444")) {
                return theme;
            }
            if (normalized.contains("xanh") && theme.getColor().equalsIgnoreCase("#10B981")) {
                return theme;
            }
            if (normalized.contains("tim") && theme.getColor().equalsIgnoreCase("#7C3AED")) {
                return theme;
            }
        }

        return availableColors.stream()
                .filter(c -> c.getColor().equalsIgnoreCase(currentColor))
                .findFirst()
                .orElse(availableColors.isEmpty() ? CategoryThemeCatalog.COLORS.get(0) : availableColors.get(0));
    }

    public GroupSlot findGroupForNewItem(Long userId, String groupNameHint) {
        List<CategoryGroupResponse> groups = categoryService.getCategoriesForUser(userId);
        if (groups.isEmpty()) {
            return null;
        }

        if (groupNameHint != null && !groupNameHint.isBlank()) {
            String hint = normalizeText(groupNameHint);
            for (CategoryGroupResponse group : groups) {
                if (normalizeText(group.getTitle()).contains(hint) || hint.contains(normalizeText(group.getTitle()))) {
                    if (countItems(group) < MAX_ITEMS_PER_GROUP) {
                        return toSlot(group);
                    }
                }
            }
        }

        for (CategoryGroupResponse group : groups) {
            if (countItems(group) < MAX_ITEMS_PER_GROUP) {
                return toSlot(group);
            }
        }
        return toSlot(groups.get(0));
    }

    private GroupSlot toSlot(CategoryGroupResponse group) {
        return new GroupSlot(group.getId(), group.getTitle(), countItems(group));
    }

    private int countItems(CategoryGroupResponse group) {
        return group.getItems() == null ? 0 : group.getItems().size();
    }

    private String pickIcon(List<String> availableIcons, String hintedIcon) {
        if (availableIcons.isEmpty()) {
            return CategoryThemeCatalog.ICONS.get(0);
        }
        if (hintedIcon != null && availableIcons.contains(hintedIcon)) {
            return hintedIcon;
        }
        return availableIcons.get(0);
    }

    private Set<String> loadUsedIcons(Long userId) {
        Set<String> used = new HashSet<>();
        for (CategoryGroupResponse group : categoryService.getCategoriesForUser(userId)) {
            if (group.getItems() == null) {
                continue;
            }
            for (CategoryItemResponse item : group.getItems()) {
                if (item.isCustom() && item.getIcon() != null) {
                    used.add(item.getIcon().trim().toLowerCase(Locale.ROOT));
                }
            }
        }
        return used;
    }

    private Set<String> loadUsedColors(Long userId) {
        Set<String> used = new HashSet<>();
        for (CategoryGroupResponse group : categoryService.getCategoriesForUser(userId)) {
            if (group.getItems() == null) {
                continue;
            }
            for (CategoryItemResponse item : group.getItems()) {
                if (item.isCustom() && item.getColor() != null) {
                    used.add(normalizeHex(item.getColor()));
                }
            }
        }
        return used;
    }

    private Integer parseOptionIndex(String message, String keyword) {
        if (message == null) {
            return null;
        }
        String normalized = normalizeText(message);
        if (!normalized.contains(keyword)) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("(\\d+)")
                .matcher(normalized);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return null;
    }

    private String normalizeHex(String hex) {
        return hex == null ? "" : hex.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        String withoutMarks = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return withoutMarks.trim()
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("\\s+", " ");
    }

    public record ThemeSuggestion(
            String icon,
            String color,
            String bgColor,
            List<String> availableIcons,
            List<CategoryThemeCatalog.ColorTheme> availableColors
    ) {
    }

    public record ThemeOption(int index, String value, boolean selected) {
    }

    public record GroupSlot(Long groupId, String groupTitle, int itemCount) {
    }
}
