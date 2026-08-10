package com.project.app.ai.util;

import java.text.Normalizer;

public class TextNormalizer {

    /**
     * Completely strips and normalizes whitespace in user prompts:
     * - Replaces tabs, newlines, unicode non-breaking spaces (\u00A0), zero-width spaces (\u200B), BOM (\uFEFF) with standard space
     * - Collapses multiple spaces into a single space
     * - Removes whitespace before punctuation marks
     * - Trims leading and trailing spaces
     */
    public static String normalizeWhitespace(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("[\\s\\u00A0\\u200B\\uFEFF]+", " ").trim();
        return cleaned.replaceAll("\\s+([.,?!:])", "$1").trim();
    }

    public static String removeAccents(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}+", "")
                .replaceAll("[đ]", "d")
                .replaceAll("[Đ]", "D");
    }

    public static String normalize(String text) {
        if (text == null) return "";
        String clean = normalizeWhitespace(text);
        return removeAccents(clean).toLowerCase().trim();
    }
}
