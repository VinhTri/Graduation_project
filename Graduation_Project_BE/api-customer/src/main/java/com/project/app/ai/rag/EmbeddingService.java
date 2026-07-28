package com.project.app.ai.rag;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.app.ai.config.GeminiConfig;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final RestClient geminiRestClient;
    private final GeminiConfig geminiConfig;

    public List<Double> getEmbedding(String text) {
        String embeddingModel = geminiConfig.getApiEmbeddingModel();
        String uri = String.format("/v1beta/models/%s:embedContent?key=%s", embeddingModel, geminiConfig.getApiKey());

        EmbeddingRequest request = EmbeddingRequest.builder()
                .model("models/" + embeddingModel)
                .content(EmbeddingRequest.Content.builder()
                        .parts(List.of(EmbeddingRequest.Part.builder().text(text).build()))
                        .build())
                .build();

        try {
            EmbeddingResponse response = geminiRestClient.post()
                    .uri(uri)
                    .body(request)
                    .retrieve()
                    .body(EmbeddingResponse.class);

            if (response == null || response.getEmbedding() == null || response.getEmbedding().getValues() == null) {
                throw new RuntimeException("Empty response or values from Gemini Embedding API");
            }
            return response.getEmbedding().getValues();
        } catch (Exception e) {
            log.error("Failed to generate embedding for text", e);
            throw new RuntimeException("Gemini embedding API error: " + e.getMessage(), e);
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmbeddingRequest {
        private String model;
        private Content content;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Content {
            private List<Part> parts;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Part {
            private String text;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EmbeddingResponse {
        private EmbeddingDetail embedding;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class EmbeddingDetail {
            private List<Double> values;
        }
    }
}
