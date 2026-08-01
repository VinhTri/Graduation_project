package com.project.app.ai.parser;

import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GoalNameParser {

    public String extractGoalName(String rawUserPrompt, String normalizedText) {
        if (rawUserPrompt == null || rawUserPrompt.trim().isEmpty()) return "mục tiêu tài chính";

        Matcher mItem = Pattern.compile("(?i)(iphone(?:\\s*\\d+)?(?:\\s*pro(?:\\s*max)?)?|ipad|macbook|laptop|may tinh|dien thoai|dienthoai|smartphone|xe may|o to|oto|xe hoi|nha)").matcher(rawUserPrompt);
        if (mItem.find()) {
            String found = mItem.group(1).trim();
            if (found.equalsIgnoreCase("iphone")) return "iPhone";
            if (found.toLowerCase().startsWith("iphone")) {
                String cleaned = found.replaceAll("(?i)\\s*\\d+$", "").trim();
                return cleaned.isEmpty() ? "iPhone" : cleaned;
            }
            if (found.equalsIgnoreCase("laptop") || found.equalsIgnoreCase("may tinh")) return "laptop";
            if (found.equalsIgnoreCase("dien thoai") || found.equalsIgnoreCase("dienthoai") || found.equalsIgnoreCase("smartphone")) return "điện thoại";
            if (found.equalsIgnoreCase("xe may")) return "xe máy";
            if (found.equalsIgnoreCase("o to") || found.equalsIgnoreCase("oto") || found.equalsIgnoreCase("xe hoi")) return "ô tô";
            if (found.equalsIgnoreCase("nha")) return "nhà";
        }

        Matcher mPurchase = Pattern.compile("(?i)(?:mua|sắm)\\s+([a-zA-Z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ\\s]+)", Pattern.CASE_INSENSITIVE).matcher(rawUserPrompt);
        if (mPurchase.find()) {
            String item = mPurchase.group(1).trim();
            item = item.replaceAll("(?i)\\s+(khoảng|tầm|giá|vào|sau|trong|trước|cuối|đến|để|trước tết|cuối năm).*$", "").trim();
            item = item.replaceAll("(?i)\\s*\\d+.*$", "").trim();
            if (!item.isEmpty() && !item.equalsIgnoreCase("mục tiêu") && !item.equalsIgnoreCase("sắm")) {
                return item;
            }
        }

        if (normalizedText != null && (normalizedText.contains("co ") || normalizedText.contains("tiet kiem") || normalizedText.contains("tich luy") || normalizedText.contains("du dinh"))) {
            return "tích lũy";
        }

        return "mục tiêu tài chính";
    }

    public String extractGoalNameFromHistory(List<ChatMessageHistoryDto> history) {
        if (history != null) {
            for (int i = 0; i < history.size(); i++) {
                ChatMessageHistoryDto msg = history.get(i);
                if (msg != null && msg.getContent() != null && "user".equalsIgnoreCase(msg.getRole())) {
                    String normContent = normalizeText(msg.getContent());
                    String extracted = extractGoalName(msg.getContent(), normContent);
                    if (!"mục tiêu tài chính".equalsIgnoreCase(extracted) && !"tích lũy".equalsIgnoreCase(extracted)) {
                        return extracted;
                    }
                }
            }
        }
        return "mục tiêu tài chính";
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .trim();
    }
}
