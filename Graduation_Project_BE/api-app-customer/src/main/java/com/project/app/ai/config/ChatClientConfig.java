package com.project.app.ai.config;

import com.project.app.ai.client.GeminiClient;
import com.project.app.ai.orchestration.ChatClient;
import com.project.app.ai.orchestration.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatClientConfig {

    @Bean
    public ChatModel chatModel(GeminiClient geminiClient) {
        return new ChatModel(geminiClient);
    }

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }
}
