package com.project.app.ai.tool;

import com.project.app.ai.rag.AppKnowledgeService;
import com.project.app.ai.rag.DocumentChunk;
import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppGuideTool implements AiTool {

    private final AppKnowledgeService appKnowledgeService;

    @Override
    public String getName() {
        return "get_app_guide";
    }

    @Override
    public String getDescription() {
        return "Tra cứu RAG tài liệu hướng dẫn sử dụng ứng dụng SmartSpend (Nạp tiền, Rút tiền, Tạo ví, Ngân sách, Tạo danh mục thu chi, Mã PIN...).";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        Map<String, Object> props = new HashMap<>();

        Map<String, Object> topicProp = new HashMap<>();
        topicProp.put("type", "STRING");
        topicProp.put("description", "Chủ đề hoặc câu hỏi hướng dẫn ứng dụng (ví dụ: 'Nạp tiền', 'Rút tiền', 'Nạp rút tiền', 'Tạo ví', 'Ngân sách', 'Mã PIN')");
        props.put("topic", topicProp);

        parameters.put("properties", props);
        decl.put("parameters", parameters);

        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        String topicArg = arguments != null && arguments.containsKey("topic") ? (String) arguments.get("topic") : "GENERAL";
        String resolvedTopic = resolveTopicMetadata(topicArg);

        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks(topicArg, resolvedTopic);

        String resultText;
        if (chunks == null || chunks.isEmpty()) {
            resultText = "Rất tiếc, SmartSpend chưa tìm thấy tài liệu hướng dẫn phù hợp với câu hỏi của bạn.";
        } else {
            resultText = chunks.stream()
                    .map(DocumentChunk::getContent)
                    .collect(Collectors.joining("\n\n---\n\n"));
        }

        Map<String, Object> resData = new HashMap<>();
        resData.put("topic", topicArg);
        resData.put("resolvedTopicMetadata", resolvedTopic);
        resData.put("guideContent", resultText);
        resData.put("retrievedCount", chunks != null ? chunks.size() : 0);

        return ToolResultDto.builder()
                .toolName(getName())
                .success(true)
                .message("Tra cứu RAG hướng dẫn ứng dụng thành công")
                .data(resData)
                .build();
    }

    private String resolveTopicMetadata(String query) {
        String norm = removeAccents(query);

        if (norm.contains("nap") && norm.contains("rut")) {
            return "WALLET_DEPOSIT_AND_WITHDRAW";
        }
        if (norm.contains("nap")) {
            return "WALLET_DEPOSIT";
        }
        if (norm.contains("rut")) {
            return "WALLET_WITHDRAW";
        }
        if (norm.contains("tao vi") || norm.contains("them vi") || norm.contains("quan ly vi") || norm.contains("wallet") || isWordMatch(norm, "vi")) {
            return "WALLET_CREATE";
        }
        if (norm.contains("ngan sach") || norm.contains("budget")) {
            return "BUDGET_CREATE";
        }
        if (norm.contains("danh muc") || norm.contains("category")) {
            return "CATEGORY_CREATE";
        }
        if (norm.contains("quen pin") || norm.contains("mat pin")) {
            return "PIN_FORGOT";
        }
        if (norm.contains("doi pin") || norm.contains("pin")) {
            return "PIN_CHANGE";
        }

        return "GENERAL";
    }

    private boolean isWordMatch(String text, String word) {
        if (text == null || word == null) return false;
        String[] tokens = text.split("\\s+");
        for (String t : tokens) {
            if (t.equalsIgnoreCase(word)) return true;
        }
        return false;
    }

    private String removeAccents(String text) {
        if (text == null) return "";
        String temp = Normalizer.normalize(text, Normalizer.Form.NFD);
        return temp.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replace("đ", "d")
                .trim();
    }
}
