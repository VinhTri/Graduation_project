package com.project.app.ai.rag;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.app.ai.config.VectorDbConfig;
import com.project.app.ai.dto.response.CitationDto;
import jakarta.annotation.PostConstruct;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
@Slf4j
public class VectorStoreService {

    private final RestClient qdrantRestClient;
    private final VectorDbConfig vectorDbConfig;
    private final EmbeddingService embeddingService;

    public VectorStoreService(
            @Qualifier("qdrantRestClient") RestClient qdrantRestClient,
            VectorDbConfig vectorDbConfig,
            EmbeddingService embeddingService) {
        this.qdrantRestClient = qdrantRestClient;
        this.vectorDbConfig = vectorDbConfig;
        this.embeddingService = embeddingService;
    }

    @PostConstruct
    public void initCollection() {
        String collection = vectorDbConfig.getCollectionName();
        log.info("Checking if Qdrant collection '{}' exists...", collection);
        try {
            // Check if collection exists
            qdrantRestClient.get()
                    .uri("/collections/" + collection)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Qdrant collection '{}' already exists.", collection);
        } catch (Exception e) {
            log.warn("Collection '{}' does not exist. Attempting to create it...", collection, e);
            try {
                Map<String, Object> createPayload = Map.of(
                        "vectors", Map.of(
                                "size", 3072, // gemini-embedding-2 output dimension
                                "distance", "Cosine"
                        )
                );
                qdrantRestClient.put()
                        .uri("/collections/" + collection)
                        .body(createPayload)
                        .retrieve()
                        .toBodilessEntity();
                log.info("Successfully created Qdrant collection '{}'.", collection);
            } catch (Exception ex) {
                log.error("Failed to auto-create Qdrant collection '{}'. Verify Qdrant connection.", collection, ex);
            }
        }
    }

    public void upsertDocument(String docId, String title, String snippet, String url) {
        String collection = vectorDbConfig.getCollectionName();
        List<Double> vector = embeddingService.getEmbedding(snippet);

        Map<String, Object> point = Map.of(
                "id", UUID.nameUUIDFromBytes((docId + "_" + snippet.hashCode()).getBytes()).toString(),
                "vector", vector,
                "payload", Map.of(
                        "source_name", title,
                        "source_url", url != null ? url : "",
                        "content_snippet", snippet
                )
        );

        Map<String, Object> payload = Map.of("points", List.of(point));

        try {
            qdrantRestClient.put()
                    .uri("/collections/" + collection + "/points?wait=true")
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Uploaded chunk for document '{}' to Qdrant.", title);
        } catch (Exception e) {
            log.error("Failed to upsert chunk into Qdrant", e);
            throw new RuntimeException("Qdrant Vector DB Upsert error: " + e.getMessage(), e);
        }
    }

    public List<CitationDto> hybridSearch(String query, int limit) {
        String collection = vectorDbConfig.getCollectionName();
        List<Double> queryVector = embeddingService.getEmbedding(query);

        Map<String, Object> searchPayload = Map.of(
                "vector", queryVector,
                "limit", limit,
                "with_payload", true,
                "with_vector", false
        );

        try {
            QdrantSearchResponse response = qdrantRestClient.post()
                    .uri("/collections/" + collection + "/points/search")
                    .body(searchPayload)
                    .retrieve()
                    .body(QdrantSearchResponse.class);

            if (response == null || response.getResult() == null) {
                return Collections.emptyList();
            }

            List<CitationDto> citations = new ArrayList<>();
            for (QdrantSearchResponse.SearchResult result : response.getResult()) {
                Map<String, Object> payload = result.getPayload();
                if (payload != null) {
                    citations.add(CitationDto.builder()
                            .sourceName((String) payload.getOrDefault("source_name", "Unknown"))
                            .sourceUrl((String) payload.getOrDefault("source_url", ""))
                            .snippet((String) payload.getOrDefault("content_snippet", ""))
                            .similarityScore(result.getScore())
                            .build());
                }
            }
            return citations;
        } catch (Exception e) {
            log.error("Failed to search Qdrant for query: {}", query, e);
            // Return empty instead of failing the chat flow to ensure service availability
            return Collections.emptyList();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QdrantSearchResponse {
        private List<SearchResult> result;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class SearchResult {
            private String id;
            private double score;
            private Map<String, Object> payload;
        }
    }
}
