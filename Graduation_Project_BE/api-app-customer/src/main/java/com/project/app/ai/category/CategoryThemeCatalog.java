package com.project.app.ai.category;

import lombok.Value;

import java.util.List;
import java.util.Map;

public final class CategoryThemeCatalog {

    private CategoryThemeCatalog() {
    }

    public static final List<String> ICONS = List.of(
            "restaurant", "cafe", "fast-food", "pizza",
            "cart", "bag-handle", "shirt", "pricetag",
            "car", "bus", "bicycle", "airplane",
            "home", "flash", "water", "wifi",
            "medkit", "fitness", "school", "book",
            "game-controller", "film", "receipt", "cash"
    );

    public static final List<ColorTheme> COLORS = List.of(
            new ColorTheme("#EF4444", "#FEE2E2"),
            new ColorTheme("#F43F5E", "#FFE4E6"),
            new ColorTheme("#E11D48", "#FFE4E6"),
            new ColorTheme("#FB7185", "#FFE4E6"),
            new ColorTheme("#F59E0B", "#FEF3C7"),
            new ColorTheme("#EAB308", "#FEF9C3"),
            new ColorTheme("#CA8A04", "#FEF9C3"),
            new ColorTheme("#D97706", "#FFEDD5"),
            new ColorTheme("#10B981", "#D1FAE5"),
            new ColorTheme("#34D399", "#D1FAE5"),
            new ColorTheme("#14B8A6", "#CCFBF1"),
            new ColorTheme("#2DD4BF", "#CCFBF1"),
            new ColorTheme("#3B82F6", "#DBEAFE"),
            new ColorTheme("#2563EB", "#DBEAFE"),
            new ColorTheme("#1D4ED8", "#DBEAFE"),
            new ColorTheme("#38BDF8", "#E0F2FE"),
            new ColorTheme("#A855F7", "#F3E8FF"),
            new ColorTheme("#7C3AED", "#EDE9FE"),
            new ColorTheme("#C026D3", "#FAE8FF"),
            new ColorTheme("#DB2777", "#FCE7F3"),
            new ColorTheme("#06B6D4", "#CFFAFE"),
            new ColorTheme("#0891B2", "#CFFAFE"),
            new ColorTheme("#84CC16", "#ECFCCB"),
            new ColorTheme("#65A30D", "#ECFCCB")
    );

    private static final Map<String, String> LABEL_ICON_HINTS = Map.ofEntries(
            Map.entry("an", "restaurant"),
            Map.entry("uong", "cafe"),
            Map.entry("cafe", "cafe"),
            Map.entry("coffee", "cafe"),
            Map.entry("nha hang", "restaurant"),
            Map.entry("gym", "fitness"),
            Map.entry("tap", "fitness"),
            Map.entry("suc khoe", "medkit"),
            Map.entry("xe", "car"),
            Map.entry("xang", "car"),
            Map.entry("di chuyen", "car"),
            Map.entry("bus", "bus"),
            Map.entry("mua sam", "cart"),
            Map.entry("shop", "bag-handle"),
            Map.entry("quan ao", "shirt"),
            Map.entry("nha", "home"),
            Map.entry("dien", "flash"),
            Map.entry("nuoc", "water"),
            Map.entry("wifi", "wifi"),
            Map.entry("hoc", "school"),
            Map.entry("sach", "book"),
            Map.entry("game", "game-controller"),
            Map.entry("phim", "film"),
            Map.entry("luong", "cash"),
            Map.entry("tien", "cash")
    );

    @Value
    public static class ColorTheme {
        String color;
        String bgColor;
    }

    public static String suggestIconForLabel(String normalizedLabel) {
        if (normalizedLabel == null || normalizedLabel.isBlank()) {
            return null;
        }
        for (Map.Entry<String, String> entry : LABEL_ICON_HINTS.entrySet()) {
            if (normalizedLabel.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }
}
