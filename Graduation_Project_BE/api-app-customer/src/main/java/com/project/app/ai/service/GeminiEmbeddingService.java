package com.project.app.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.app.ai.client.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiEmbeddingService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    /**
     * Generate text embedding vector using Google Gemini text-embedding-004 model (768 dimensions)
     */
    public float[] embedText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new float[0];
        }

        String apiKey = geminiClient.getEffectiveGeminiApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("GEMINI_API_KEY is missing. Cannot generate vector embedding.");
            return new float[0];
        }

        try {
            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

            ObjectNode rootNode = objectMapper.createObjectNode();
            rootNode.put("model", "models/text-embedding-004");

            ObjectNode contentNode = objectMapper.createObjectNode();
            ObjectNode partNode = objectMapper.createObjectNode();
            partNode.put("text", text);
            contentNode.set("parts", objectMapper.createArrayNode().add(partNode));
            rootNode.set("content", contentNode);

            String jsonPayload = objectMapper.writeValueAsString(rootNode);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode valuesNode = root.path("embedding").path("values");

                if (valuesNode != null && valuesNode.isArray()) {
                    float[] vector = new float[valuesNode.size()];
                    for (int i = 0; i < valuesNode.size(); i++) {
                        vector[i] = (float) valuesNode.get(i).asDouble();
                    }
                    return vector;
                }
            } else {
                log.warn("Gemini Embedding API returned HTTP status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to generate vector embedding via Gemini API: {}", e.getMessage(), e);
        }

        return new float[0];
    }

    /**
     * Convert float array to pgvector string format: [0.123, -0.456, 0.789]
     */
    public String formatVectorForPg(float[] vector) {
        if (vector == null || vector.length == 0) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }
}
