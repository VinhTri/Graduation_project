package com.project.app.ai.guardrail;

import com.project.app.ai.util.TextNormalizer;
import com.project.app.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Component
public class GuardrailService implements AiGuardrail {

    private static final int MAX_PROMPT_LENGTH = 2000;

    // 1. Prompt Injection Regex Patterns
    private static final List<Pattern> PROMPT_INJECTION_PATTERNS = List.of(
            Pattern.compile("ignore\\s+(?:all\\s+)?(?:previous|system)\\s+instructions", Pattern.CASE_INSENSITIVE),
            Pattern.compile("disregard\\s+(?:all\\s+)?(?:prior|previous)\\s+prompts", Pattern.CASE_INSENSITIVE),
            Pattern.compile("you\\s+are\\s+now\\s+(?:in\\s+)?(?:dan|developer\\s+mode|unrestricted)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:show|print|reveal|expose)\\s+(?:your\\s+)?system\\s+prompt", Pattern.CASE_INSENSITIVE),
            Pattern.compile("override\\s+(?:system|security)\\s+rules", Pattern.CASE_INSENSITIVE),
            Pattern.compile("bo\\s+qua\\s+huong\\s+dan\\s+truoc", Pattern.CASE_INSENSITIVE)
    );

    // 2. Unsupported / Harmful Request Patterns
    private static final List<Pattern> UNSUPPORTED_REQUEST_PATTERNS = List.of(
            Pattern.compile("(?:hack|exploit|bypass)\\s+(?:system|database|password|bank|pin)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:tan\\s+cong|xam\\s+nhap|chiem\\s+quyen)\\s+(?:he\\s+thong|tai\\s+khoan)", Pattern.CASE_INSENSITIVE)
    );

    // 3. Sensitive Data Patterns (Raw Credit Card 16 digits, raw password leak)
    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile("\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\b");
    private static final Pattern RAW_PASSWORD_PATTERN = Pattern.compile("(?:mat\\s+khau|password)\\s*[:=]\\s*\\S+", Pattern.CASE_INSENSITIVE);

    @Override
    public boolean validateInput(User user, String userPrompt) {
        return checkInput(user, userPrompt).isValid();
    }

    @Override
    public GuardrailResult checkInput(User user, String userPrompt) {
        // Layer 1: Empty Input Check
        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            log.warn("Guardrail check failed: Empty input prompt");
            return GuardrailResult.fail(GuardrailResult.GuardrailType.EMPTY_INPUT, "Nội dung câu hỏi không được để trống.");
        }

        // Layer 2: Max Length Check
        if (userPrompt.length() > MAX_PROMPT_LENGTH) {
            log.warn("Guardrail check failed: Prompt length ({}) exceeds limit ({})", userPrompt.length(), MAX_PROMPT_LENGTH);
            return GuardrailResult.fail(GuardrailResult.GuardrailType.EXCEEDS_MAX_LENGTH, "Nội dung câu hỏi vượt quá độ dài tối đa cho phép (2000 ký tự).");
        }

        String norm = TextNormalizer.normalize(userPrompt);

        // Layer 3: Prompt Injection Check
        for (Pattern pattern : PROMPT_INJECTION_PATTERNS) {
            if (pattern.matcher(userPrompt).find() || pattern.matcher(norm).find()) {
                log.warn("Guardrail check failed: Prompt injection detected in prompt [{}]", userPrompt);
                return GuardrailResult.fail(GuardrailResult.GuardrailType.PROMPT_INJECTION, "Yêu cầu bị từ chối do vi phạm chính sách an toàn bảo mật AI.");
            }
        }

        // Layer 4: Unsupported / Harmful Request Check
        for (Pattern pattern : UNSUPPORTED_REQUEST_PATTERNS) {
            if (pattern.matcher(userPrompt).find() || pattern.matcher(norm).find()) {
                log.warn("Guardrail check failed: Unsupported harmful request in prompt [{}]", userPrompt);
                return GuardrailResult.fail(GuardrailResult.GuardrailType.UNSUPPORTED_REQUEST, "SmartSpend AI chỉ hỗ trợ các câu hỏi liên quan đến quản lý tài chính và hướng dẫn ứng dụng.");
            }
        }

        // Layer 5: Sensitive Data Leak Check
        if (CREDIT_CARD_PATTERN.matcher(userPrompt).find() || RAW_PASSWORD_PATTERN.matcher(userPrompt).find()) {
            log.warn("Guardrail check failed: Sensitive credentials detected in prompt");
            return GuardrailResult.fail(GuardrailResult.GuardrailType.SENSITIVE_DATA_LEAK, "Vì lý do an toàn bảo mật, vui lòng không chia sẻ mật khẩu hoặc số thẻ ngân hàng vào ô chat.");
        }

        return GuardrailResult.ok();
    }
}
