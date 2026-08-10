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
import java.util.*;

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
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && !geminiApiKey.contains("YOUR_GEMINI_API_KEY")) {
            return geminiApiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }
        return "";
    }

    public List<String> getCandidateModels() {
        List<String> candidateModels = new ArrayList<>();
        if (configuredModel != null && !configuredModel.trim().isEmpty()) {
            candidateModels.add(configuredModel.trim());
        }
        List<String> preferredOrder = Arrays.asList("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro");
        for (String m : preferredOrder) {
            if (!candidateModels.contains(m)) {
                candidateModels.add(m);
            }
        }
        return candidateModels;
    }

    /**
     * Turn 1: Call Gemini with User prompt and Tool Declarations
     */
    public GeminiResponseDto callGeminiApiWithTools(
            String systemPrompt,
            String userPrompt,
            List<ChatMessageHistoryDto> history,
            List<Map<String, Object>> toolDeclarations
    ) throws Exception {

        String activeApiKey = getEffectiveGeminiApiKey();
        if (activeApiKey.isEmpty()) {
            log.warn("GEMINI_API_KEY is empty. Skipping Gemini remote call.");
            throw new IllegalStateException("GEMINI_API_KEY is empty");
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();

        List<String> candidateModels = getCandidateModels();
        Exception lastException = null;

        for (String modelName : candidateModels) {
            try {
                // Fixed Lỗi 1: Do not append ?key= in URL when sending x-goog-api-key header
                String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";

                ObjectNode rootNode = objectMapper.createObjectNode();

                // System instruction
                ObjectNode systemInstruction = objectMapper.createObjectNode();
                ObjectNode sysParts = objectMapper.createObjectNode();
                sysParts.put("text", systemPrompt);
                systemInstruction.set("parts", objectMapper.createArrayNode().add(sysParts));
                rootNode.set("system_instruction", systemInstruction);

                // Contents
                ArrayNode contentsArray = objectMapper.createArrayNode();
                if (history != null && !history.isEmpty()) {
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

                ObjectNode currentTurn = objectMapper.createObjectNode();
                currentTurn.put("role", "user");
                ObjectNode currentPart = objectMapper.createObjectNode();
                currentPart.put("text", userPrompt);
                currentTurn.set("parts", objectMapper.createArrayNode().add(currentPart));
                contentsArray.add(currentTurn);

                rootNode.set("contents", contentsArray);

                // Tools declaration if available
                if (toolDeclarations != null && !toolDeclarations.isEmpty()) {
                    ArrayNode funcDecls = objectMapper.createArrayNode();
                    for (Map<String, Object> toolDecl : toolDeclarations) {
                        funcDecls.add(objectMapper.valueToTree(toolDecl));
                    }
                    ObjectNode toolNode = objectMapper.createObjectNode();
                    toolNode.set("function_declarations", funcDecls);
                    rootNode.set("tools", objectMapper.createArrayNode().add(toolNode));
                }

                // Generation Config
                ObjectNode genConfig = objectMapper.createObjectNode();
                genConfig.put("temperature", 0.1);
                genConfig.put("maxOutputTokens", 1024);
                rootNode.set("generationConfig", genConfig);

                String jsonPayload = objectMapper.writeValueAsString(rootNode);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", activeApiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> httpResponse = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

                if (httpResponse.statusCode() == 200) {
                    log.info("Successfully called Gemini model [{}]", modelName);
                    return parseGeminiResponse(httpResponse.body());
                } else {
                    log.warn("Gemini model {} returned status {}: {}", modelName, httpResponse.statusCode(), httpResponse.body());
                    lastException = new RuntimeException("HTTP " + httpResponse.statusCode() + ": " + httpResponse.body());
                }
            } catch (Exception e) {
                log.warn("Error calling Gemini model {}: {}", modelName, e.getMessage());
                lastException = e;
            }
        }

        throw new RuntimeException("All Gemini candidate models failed. Last error: " + (lastException != null ? lastException.getMessage() : "Unknown"));
    }

    /**
     * Turn 2: Send single Tool Execution Result back to Gemini
     */
    public String sendToolResultToGemini(
            String systemPrompt,
            String userPrompt,
            List<ChatMessageHistoryDto> history,
            ToolCallDto toolCall,
            ToolResultDto toolResult
    ) throws Exception {
        return sendToolResultsToGemini(systemPrompt, userPrompt, history, List.of(toolCall), List.of(toolResult));
    }

    /**
     * Turn 2: Send Multiple Tool Execution Results back to Gemini (Parallel Tool Calling)
     */
    public String sendToolResultsToGemini(
            String systemPrompt,
            String userPrompt,
            List<ChatMessageHistoryDto> history,
            List<ToolCallDto> toolCalls,
            List<ToolResultDto> toolResults
    ) throws Exception {

        String activeApiKey = getEffectiveGeminiApiKey();
        if (activeApiKey.isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY is empty");
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();

        List<String> candidateModels = getCandidateModels();
        Exception lastException = null;

        for (String modelName : candidateModels) {
            try {
                // Fixed Lỗi 1: Do not append ?key= in URL
                String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";

                ObjectNode rootNode = objectMapper.createObjectNode();

                // System instruction
                ObjectNode systemInstruction = objectMapper.createObjectNode();
                ObjectNode sysParts = objectMapper.createObjectNode();
                sysParts.put("text", systemPrompt);
                systemInstruction.set("parts", objectMapper.createArrayNode().add(sysParts));
                rootNode.set("system_instruction", systemInstruction);

                ArrayNode contentsArray = objectMapper.createArrayNode();

                // History
                if (history != null && !history.isEmpty()) {
                    for (ChatMessageHistoryDto msg : history) {
                        if (msg != null && msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                            ObjectNode historyTurn = objectMapper.createObjectNode();
                            historyTurn.put("role", "user".equalsIgnoreCase(msg.getRole()) ? "user" : "model");
                            ObjectNode historyPart = objectMapper.createObjectNode();
                            historyPart.put("text", msg.getContent());
                            historyTurn.set("parts", objectMapper.createArrayNode().add(historyPart));
                            contentsArray.add(historyTurn);
                        }
                    }
                }

                // 1. Original User Prompt
                ObjectNode userTurn = objectMapper.createObjectNode();
                userTurn.put("role", "user");
                ObjectNode userPart = objectMapper.createObjectNode();
                userPart.put("text", userPrompt);
                userTurn.set("parts", objectMapper.createArrayNode().add(userPart));
                contentsArray.add(userTurn);

                // 2. Model Tool Calls Turn
                ObjectNode modelTurn = objectMapper.createObjectNode();
                modelTurn.put("role", "model");
                ArrayNode modelParts = objectMapper.createArrayNode();
                for (ToolCallDto tc : toolCalls) {
                    ObjectNode funcCallPart = objectMapper.createObjectNode();
                    ObjectNode funcCall = objectMapper.createObjectNode();
                    funcCall.put("name", tc.getName());
                    if (tc.getId() != null && !tc.getId().isEmpty()) {
                        funcCall.put("id", tc.getId());
                    }
                    if (tc.getArguments() != null) {
                        funcCall.set("args", objectMapper.valueToTree(tc.getArguments()));
                    }
                    funcCallPart.set("functionCall", funcCall);
                    modelParts.add(funcCallPart);
                }
                modelTurn.set("parts", modelParts);
                contentsArray.add(modelTurn);

                // 3. User Tool Responses Turn (Fixed Lỗi 2: Standard Google functionResponse format with "result")
                ObjectNode toolResponseTurn = objectMapper.createObjectNode();
                toolResponseTurn.put("role", "user");
                ArrayNode toolResParts = objectMapper.createArrayNode();

                for (int i = 0; i < toolCalls.size(); i++) {
                    ToolCallDto tc = toolCalls.get(i);
                    ToolResultDto tr = (toolResults != null && i < toolResults.size()) ? toolResults.get(i) : null;

                    ObjectNode funcResPart = objectMapper.createObjectNode();
                    ObjectNode funcRes = objectMapper.createObjectNode();
                    funcRes.put("name", tc.getName());
                    if (tc.getId() != null && !tc.getId().isEmpty()) {
                        funcRes.put("id", tc.getId());
                    }

                    ObjectNode resContent = objectMapper.createObjectNode();
                    resContent.set("result", objectMapper.valueToTree(tr != null && tr.getData() != null ? tr.getData() : Collections.emptyMap()));
                    funcRes.set("response", resContent);

                    funcResPart.set("functionResponse", funcRes);
                    toolResParts.add(funcResPart);
                }
                toolResponseTurn.set("parts", toolResParts);
                contentsArray.add(toolResponseTurn);

                rootNode.set("contents", contentsArray);

                // Generation Config
                ObjectNode genConfig = objectMapper.createObjectNode();
                genConfig.put("temperature", 0.2);
                genConfig.put("maxOutputTokens", 1024);
                rootNode.set("generationConfig", genConfig);

                String jsonPayload = objectMapper.writeValueAsString(rootNode);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", activeApiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> httpResponse = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

                if (httpResponse.statusCode() == 200) {
                    GeminiResponseDto res = parseGeminiResponse(httpResponse.body());
                    return res.getText() != null ? res.getText() : "";
                } else {
                    log.warn("Gemini model {} Turn 2 returned status {}: {}", modelName, httpResponse.statusCode(), httpResponse.body());
                    lastException = new RuntimeException("HTTP " + httpResponse.statusCode());
                }
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw new RuntimeException("All Gemini Turn 2 endpoints failed. Last error: " + (lastException != null ? lastException.getMessage() : "Unknown"));
    }

    private GeminiResponseDto parseGeminiResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidate = root.path("candidates").get(0);
        if (candidate == null || !candidate.has("content")) {
            return GeminiResponseDto.builder().text("").build();
        }

        JsonNode partsNode = candidate.path("content").path("parts");
        if (partsNode == null || partsNode.isEmpty()) {
            return GeminiResponseDto.builder().text("").build();
        }

        List<ToolCallDto> toolCalls = new ArrayList<>();
        StringBuilder textBuilder = new StringBuilder();

        for (JsonNode part : partsNode) {
            if (part.has("functionCall")) {
                JsonNode fc = part.get("functionCall");
                String name = fc.path("name").asText();
                String id = fc.has("id") ? fc.get("id").asText() : null;
                String thoughtSig = part.has("thoughtSignature") ? part.get("thoughtSignature").asText() : null;

                Map<String, Object> args = new HashMap<>();
                if (fc.has("args")) {
                    args = objectMapper.convertValue(fc.get("args"), Map.class);
                }
                toolCalls.add(ToolCallDto.builder()
                        .id(id)
                        .name(name)
                        .arguments(args)
                        .thoughtSignature(thoughtSig)
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
}
