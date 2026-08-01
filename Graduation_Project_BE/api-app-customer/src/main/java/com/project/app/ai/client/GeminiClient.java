package com.project.app.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
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

    public String callGeminiApi(String systemPrompt, String userPrompt, List<ChatMessageHistoryDto> history) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        String activeApiKey = getEffectiveGeminiApiKey();

        if (activeApiKey.isEmpty()) {
            log.warn("GEMINI_API_KEY is empty or unconfigured. Skipping Gemini remote call and invoking fallback.");
            throw new IllegalStateException("GEMINI_API_KEY is empty");
        }

        String maskedKey = activeApiKey.length() > 8 ? activeApiKey.substring(0, 6) + "..." + activeApiKey.substring(activeApiKey.length() - 4) : "***";
        log.info("Executing Gemini Client request with API Key [{}]", maskedKey);

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

        Exception lastException = null;

        for (String modelName : candidateModels) {
            try {
                String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + activeApiKey;

                ObjectNode rootNode = objectMapper.createObjectNode();

                ObjectNode systemInstruction = objectMapper.createObjectNode();
                ObjectNode sysParts = objectMapper.createObjectNode();
                sysParts.put("text", systemPrompt);
                systemInstruction.set("parts", objectMapper.createArrayNode().add(sysParts));
                rootNode.set("system_instruction", systemInstruction);

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
                    JsonNode resJson = objectMapper.readTree(httpResponse.body());
                    JsonNode candidate = resJson.path("candidates").get(0);
                    if (candidate != null && candidate.has("content")) {
                        JsonNode partNode = candidate.path("content").path("parts").get(0);
                        if (partNode != null && partNode.has("text")) {
                            log.info("Successfully received AI response from model [{}]", modelName);
                            return partNode.path("text").asText().trim();
                        }
                    }
                } else {
                    log.warn("Gemini model {} returned status {}: {}", modelName, httpResponse.statusCode(), httpResponse.body());
                }
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw new RuntimeException("All Gemini model endpoints failed. Last error: " + (lastException != null ? lastException.getMessage() : "Unknown"));
    }
}
