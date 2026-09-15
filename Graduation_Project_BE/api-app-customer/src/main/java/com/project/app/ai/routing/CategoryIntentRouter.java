package com.project.app.ai.routing;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class CategoryIntentRouter {

    private static final Pattern LIST_EXPLICIT = Pattern.compile(
            "(?i)(danh\\s*mục|danh\\s*muc)\\s*(của tôi|cua toi|hiện tại|hien tai|đang có|dang co)?\\s*$"
                    + "|(?i)^(xem|liệt kê|liet ke|cho tôi|cho toi)\\s+(danh\\s*mục|danh\\s*muc)"
                    + "|(?i)(có mấy|co may|bao nhiêu|bao nhieu)\\s+(danh\\s*mục|danh\\s*muc|nhóm chi tiêu|nhom chi tieu)"
                    + "|(?i)(danh\\s*mục|danh\\s*muc)\\s+(của tôi|cua toi|hiện tại|hien tai|list|liệt kê|liet ke)"
    );

    private static final Pattern SPENDING_TYPES = Pattern.compile(
            "(?i)(loại|loai|những loại|nhung loai|các loại|cac loai|khoản|khoan|phân loại|phan loai)"
                    + ".*(chi tiêu|chi tieu|tiêu|tieu)"
                    + "|(?i)(chi tiêu|chi tieu).*(loại|loai|những loại|cac loai)"
                    + "|(?i)(tôi|toi).*(những loại|cac loai|loại|loai).*(chi tiêu|chi tieu)"
                    + "|(?i)(tôi|toi).*(chi tiêu|chi tieu).*(loại|loai|nào|nao)"
    );

    private static final Pattern GUIDE = Pattern.compile(
            "(?i)(danh\\s*mục|danh\\s*muc).*(là gì|la gi|làm gì|lam gi|dùng để|dung de|như thế nào|nhu the nao|ở đâu|o dau|hướng dẫn|huong dan|cách|cac)"
                    + "|(?i)(cách|cac|huong dan|hướng dẫn).*(tạo|tao|thêm|them|sửa|sua|xóa|xoa|chỉnh|chinh).*(danh\\s*mục|danh\\s*muc)"
                    + "|(?i)(danh\\s*mục|danh\\s*muc)\\s+(ở đâu|o dau|là gì|la gi|làm gì|lam gi)"
    );

    public enum CategoryIntent {
        LIST,
        SPENDING_TYPES,
        INCOME_TYPES,
        GUIDE,
        NONE
    }

    public CategoryIntent detect(String message) {
        if (message == null || message.isBlank()) {
            return CategoryIntent.NONE;
        }

        String trimmed = message.trim();

        if (isGuideQuestion(trimmed)) {
            return CategoryIntent.GUIDE;
        }
        String normalized = normalize(trimmed);
        if (containsAny(normalized, "thu nhap", "nguon thu", "khoan thu", "tien vao")
                && containsAny(normalized, "danh muc", "phan loai", "loai nao", "dang co", "liet ke", "cho xem",
                "nhung nguon", "nguon thu nao", "khoan thu nao", "toi co", "cua toi")) {
            return CategoryIntent.INCOME_TYPES;
        }
        if (SPENDING_TYPES.matcher(trimmed).find()) {
            return CategoryIntent.SPENDING_TYPES;
        }
        if (LIST_EXPLICIT.matcher(trimmed).find()) {
            return CategoryIntent.LIST;
        }
        return CategoryIntent.NONE;
    }

    public boolean isSpendingTypesQuestion(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        return SPENDING_TYPES.matcher(message.trim()).find();
    }

    private boolean isGuideQuestion(String message) {
        if (GUIDE.matcher(message).find()) {
            return true;
        }

        String normalized = normalize(message);
        if (!normalized.contains("danh muc") && !normalized.contains("category")) {
            return false;
        }

        return containsAny(normalized,
                "dung de", "lam gi", "la gi", "nhu the nao", "o dau",
                "huong dan", "cach tao", "cach them", "cach sua", "cach xoa");
    }

    private String normalize(String message) {
        String withoutMarks = Normalizer.normalize(message, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return withoutMarks.trim()
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("\\s+", " ");
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
