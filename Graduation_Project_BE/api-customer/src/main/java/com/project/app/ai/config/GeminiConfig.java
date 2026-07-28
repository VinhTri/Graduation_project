package com.project.app.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class GeminiConfig {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String apiModel;

    @Value("${gemini.api.embedding-model:gemini-embedding-2}")
    private String apiEmbeddingModel;

    @Bean(name = "geminiRestClient")
    public RestClient geminiRestClient() {
        String base = apiUrl;
        if (base.endsWith("/v1beta/models")) {
            base = base.substring(0, base.length() - 14);
        } else if (base.endsWith("/v1beta/models/")) {
            base = base.substring(0, base.length() - 15);
        }
        return RestClient.builder()
                .baseUrl(base)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public String getApiModel() {
        return apiModel;
    }

    public String getApiEmbeddingModel() {
        return apiEmbeddingModel;
    }
}
