package com.project.app.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class VectorDbConfig {

    @Value("${qdrant.api.url}")
    private String qdrantUrl;

    @Value("${qdrant.api.key}")
    private String qdrantApiKey;

    @Value("${qdrant.collection.name}")
    private String collectionName;

    @Bean(name = "qdrantRestClient")
    public RestClient qdrantRestClient() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(qdrantUrl)
                .defaultHeader("Content-Type", "application/json");

        if (qdrantApiKey != null && !qdrantApiKey.trim().isEmpty()) {
            builder.defaultHeader("api-key", qdrantApiKey);
        }

        return builder.build();
    }

    public String getCollectionName() {
        return collectionName;
    }
}
