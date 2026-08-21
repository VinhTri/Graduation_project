package com.project.app.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.app.ai.client.dto.GeminiResponseDto;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.tool.dto.ToolCallDto;
import com.project.app.ai.tool.dto.ToolResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String configuredModel;

    public String getEffectiveGeminiApiKey() {
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()
                && !geminiApiKey.contains("YOUR_GEMINI_API_KEY")) {
            return geminiApiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }
        return "";
    }

    public boolean isConfigured() {
        return !getEffectiveGeminiApiKey().isEmpty();
    }

    public String chat(String systemPrompt, String userMessage, List<ChatMessageHistoryDto> history) {
        GeminiResponseDto response = chatWithTools(systemPrompt, userMessage, history, null);
        return response.getText() != null ? response.getText() : "";
    }

    public GeminiResponseDto chatWithTools(
            String systemPrompt,
            String userMessage,
            List<ChatMessageHistoryDto> history,
            List<Map<String, Object>> toolDeclarations) {

        String activeApiKey = getEffectiveGeminiApiKey();
        if (activeApiKey.isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY chưa được cấu hình");
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();

        Exception lastException = null;
        for (String modelName : getCandidateModels()) {
            try {
                ObjectNode rootNode = buildRequestRoot(systemPrompt, userMessage, history, toolDeclarations, 0.3);

                HttpResponse<String> httpResponse = sendRequest(client, modelName, activeApiKey, rootNode);
                if (httpResponse.statusCode() == 200) {
                    log.info("Gemini success with model [{}]", modelName);
                    return parseGeminiResponse(httpResponse.body());
                }

                log.warn("Gemini model {} returned status {}", modelName, httpResponse.statusCode());
                lastException = new RuntimeException("HTTP " + httpResponse.statusCode());
            } catch (Exception e) {
                log.warn("Gemini model {} failed: {}", modelName, e.getMessage());
                lastException = e;
            }
        }

        throw new RuntimeException("Không thể gọi Gemini. "
                + (lastException != null ? lastException.getMessage() : "Unknown error"));
    }

    public String continueWithToolResult(
            String systemPrompt,
            String userMessage,
            List<ChatMessageHistoryDto> history,
            ToolCallDto toolCall,
            ToolResultDto toolResult) {

        return sendToolResultsToGemini(
                systemPrompt,
                userMessage,
                history,
                List.of(toolCall),
                List.of(toolResult));
    }

    private String sendToolResultsToGemini(
            String systemPrompt,
            String userPrompt,
            List<ChatMessageHistoryDto> history,
            List<ToolCallDto> toolCalls,
            List<ToolResultDto> toolResults) {

        String activeApiKey = getEffectiveGeminiApiKey();
        if (activeApiKey.isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY chưa được cấu hình");
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();

        Exception lastException = null;
        for (String modelName : getCandidateModels()) {
            try {
                ObjectNode rootNode = objectMapper.createObjectNode();
                rootNode.set("system_instruction", buildSystemInstruction(systemPrompt));

                ArrayNode contentsArray = objectMapper.createArrayNode();
                appendHistory(contentsArray, history);

                ObjectNode userTurn = objectMapper.createObjectNode();
                userTurn.put("role", "user");
                ObjectNode userPart = objectMapper.createObjectNode();
                userPart.put("text", userPrompt);
                userTurn.set("parts", objectMapper.createArrayNode().add(userPart));
                contentsArray.add(userTurn);

                ObjectNode modelTurn = objectMapper.createObjectNode();
                modelTurn.put("role", "model");
                ArrayNode modelParts = objectMapper.createArrayNode();
                for (ToolCallDto toolCall : toolCalls) {
                    ObjectNode funcCallPart = objectMapper.createObjectNode();
                    ObjectNode funcCall = objectMapper.createObjectNode();
                    funcCall.put("name", toolCall.getName());
                    if (toolCall.getId() != null && !toolCall.getId().isEmpty()) {
                        funcCall.put("id", toolCall.getId());
                    }
                    if (toolCall.getArguments() != null) {
                        funcCall.set("args", objectMapper.valueToTree(toolCall.getArguments()));
                    }
                    funcCallPart.set("functionCall", funcCall);
                    modelParts.add(funcCallPart);
                }
                modelTurn.set("parts", modelParts);
                contentsArray.add(modelTurn);

                ObjectNode toolResponseTurn = objectMapper.createObjectNode();
                toolResponseTurn.put("role", "user");
                ArrayNode toolResParts = objectMapper.createArrayNode();
                for (int i = 0; i < toolCalls.size(); i++) {
                    ToolCallDto toolCall = toolCalls.get(i);
                    ToolResultDto toolResult = toolResults != null && i < toolResults.size()
                            ? toolResults.get(i)
                            : null;

                    ObjectNode funcResPart = objectMapper.createObjectNode();
                    ObjectNode funcRes = objectMapper.createObjectNode();
                    funcRes.put("name", toolCall.getName());
                    if (toolCall.getId() != null && !toolCall.getId().isEmpty()) {
                        funcRes.put("id", toolCall.getId());
                    }

                    ObjectNode responseContent = objectMapper.createObjectNode();
                    responseContent.set("result", objectMapper.valueToTree(
                            toolResult != null && toolResult.getData() != null
                                    ? toolResult.getData()
                                    : Collections.emptyMap()));
                    funcRes.set("response", responseContent);
                    funcResPart.set("functionResponse", funcRes);
                    toolResParts.add(funcResPart);
                }
                toolResponseTurn.set("parts", toolResParts);
                contentsArray.add(toolResponseTurn);
                rootNode.set("contents", contentsArray);

                ObjectNode genConfig = objectMapper.createObjectNode();
                genConfig.put("temperature", 0.2);
                genConfig.put("maxOutputTokens", 1024);
                rootNode.set("generationConfig", genConfig);

                HttpResponse<String> httpResponse = sendRequest(client, modelName, activeApiKey, rootNode);
                if (httpResponse.statusCode() == 200) {
                    GeminiResponseDto response = parseGeminiResponse(httpResponse.body());
                    return response.getText() != null ? response.getText() : "";
                }

                lastException = new RuntimeException("HTTP " + httpResponse.statusCode());
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw new RuntimeException("Gemini tool follow-up failed. "
                + (lastException != null ? lastException.getMessage() : "Unknown error"));
    }

    private ObjectNode buildRequestRoot(
            String systemPrompt,
            String userMessage,
            List<ChatMessageHistoryDto> history,
            List<Map<String, Object>> toolDeclarations,
            double temperature) throws Exception {

        ObjectNode rootNode = objectMapper.createObjectNode();
        rootNode.set("system_instruction", buildSystemInstruction(systemPrompt));

        ArrayNode contentsArray = objectMapper.createArrayNode();
        appendHistory(contentsArray, history);

        ObjectNode currentTurn = objectMapper.createObjectNode();
        currentTurn.put("role", "user");
        ObjectNode currentPart = objectMapper.createObjectNode();
        currentPart.put("text", userMessage);
        currentTurn.set("parts", objectMapper.createArrayNode().add(currentPart));
        contentsArray.add(currentTurn);
        rootNode.set("contents", contentsArray);

        if (toolDeclarations != null && !toolDeclarations.isEmpty()) {
            ArrayNode funcDecls = objectMapper.createArrayNode();
            for (Map<String, Object> toolDecl : toolDeclarations) {
                funcDecls.add(objectMapper.valueToTree(toolDecl));
            }
            ObjectNode toolNode = objectMapper.createObjectNode();
            toolNode.set("function_declarations", funcDecls);
            rootNode.set("tools", objectMapper.createArrayNode().add(toolNode));
        }

        ObjectNode genConfig = objectMapper.createObjectNode();
        genConfig.put("temperature", temperature);
        genConfig.put("maxOutputTokens", 1024);
        rootNode.set("generationConfig", genConfig);
        return rootNode;
    }

    private ObjectNode buildSystemInstruction(String systemPrompt) {
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ObjectNode sysPart = objectMapper.createObjectNode();
        sysPart.put("text", systemPrompt);
        systemInstruction.set("parts", objectMapper.createArrayNode().add(sysPart));
        return systemInstruction;
    }

    private HttpResponse<String> sendRequest(
            HttpClient client,
            String modelName,
            String apiKey,
            ObjectNode rootNode) throws Exception {

        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
                + modelName + ":generateContent";

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(rootNode)))
                .build();

        return client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
    }

    private GeminiResponseDto parseGeminiResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidate = root.path("candidates").get(0);
        if (candidate == null || !candidate.has("content")) {
            return GeminiResponseDto.builder().text("").toolCalls(List.of()).build();
        }

        JsonNode partsNode = candidate.path("content").path("parts");
        if (partsNode == null || !partsNode.isArray()) {
            return GeminiResponseDto.builder().text("").toolCalls(List.of()).build();
        }

        List<ToolCallDto> toolCalls = new ArrayList<>();
        StringBuilder textBuilder = new StringBuilder();

        for (JsonNode part : partsNode) {
            if (part.has("functionCall")) {
                JsonNode functionCall = part.get("functionCall");
                String name = functionCall.path("name").asText();
                String id = functionCall.has("id") ? functionCall.get("id").asText() : null;

                Map<String, Object> args = new HashMap<>();
                if (functionCall.has("args")) {
                    args = objectMapper.convertValue(functionCall.get("args"), Map.class);
                }

                toolCalls.add(ToolCallDto.builder()
                        .id(id)
                        .name(name)
                        .arguments(args)
                        .build());
            }
            if (part.has("text")) {
                textBuilder.append(part.get("text").asText());
            }
        }

        return GeminiResponseDto.builder()
                .text(textBuilder.toString().trim())
                .toolCalls(toolCalls)
                .build();
    }

    private List<String> getCandidateModels() {
        List<String> candidateModels = new ArrayList<>();
        if (configuredModel != null && !configuredModel.trim().isEmpty()) {
            candidateModels.add(configuredModel.trim());
        }
        for (String model : Arrays.asList(
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-flash-latest",
                "gemini-1.5-flash",
                "gemini-1.5-pro")) {
            if (!candidateModels.contains(model)) {
                candidateModels.add(model);
            }
        }
        return candidateModels;
    }

    private void appendHistory(ArrayNode contentsArray, List<ChatMessageHistoryDto> history) {
        if (history == null || history.isEmpty()) {
            return;
        }

        List<ChatMessageHistoryDto> validHistory = new ArrayList<>();
        for (ChatMessageHistoryDto msg : history) {
            if (msg != null && msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                validHistory.add(msg);
            }
        }
        if (validHistory.size() > 10) {
            validHistory = validHistory.subList(validHistory.size() - 10, validHistory.size());
        }

        for (ChatMessageHistoryDto msg : validHistory) {
            ObjectNode historyTurn = objectMapper.createObjectNode();
            String role = "user".equalsIgnoreCase(msg.getRole()) ? "user" : "model";
            historyTurn.put("role", role);
            ObjectNode historyPart = objectMapper.createObjectNode();
            historyPart.put("text", msg.getContent());
            historyTurn.set("parts", objectMapper.createArrayNode().add(historyPart));
            contentsArray.add(historyTurn);
        }
    }
}
