package com.project.app.ai.service;

import com.project.app.ai.config.GeminiConfig;
import com.project.app.ai.dto.gemini.GeminiRequest;
import com.project.app.ai.dto.gemini.GeminiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiClient {

    private final RestClient geminiRestClient;
    private final GeminiConfig geminiConfig;

    public GeminiResponse generate(GeminiRequest request) {
        return generateWithModel(geminiConfig.getApiModel(), request);
    }

    public GeminiResponse generateWithModel(String model, GeminiRequest request) {
        String uri = String.format("/v1beta/models/%s:generateContent?key=%s", model, geminiConfig.getApiKey());
        log.info("Sending request to Gemini model: {}", model);
        try {
            GeminiResponse response = geminiRestClient.post()
                    .uri(uri)
                    .body(request)
                    .retrieve()
                    .body(GeminiResponse.class);

            if (response == null || response.getCandidates() == null || response.getCandidates().isEmpty()) {
                log.warn("Gemini returned empty response for model: {}", model);
                throw new RuntimeException("Empty response from Gemini API");
            }
            return response;
        } catch (Exception e) {
            log.error("Failed to generate content from Gemini API with model: {}", model, e);
            throw new RuntimeException("Gemini API invocation error: " + e.getMessage(), e);
        }
    }
}
