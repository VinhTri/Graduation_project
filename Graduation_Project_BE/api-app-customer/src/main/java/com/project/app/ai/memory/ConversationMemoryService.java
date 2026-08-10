package com.project.app.ai.memory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.app.ai.dto.internal.ConversationState;
import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class ConversationMemoryService {

    private static final String REDIS_KEY_PREFIX = "ai:conversation:";
    private static final String REDIS_STATE_PREFIX = "ai:state:";
    private static final Duration CONVERSATION_TTL = Duration.ofDays(7); // 7-day TTL

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Map<String, List<ChatMessageHistoryDto>> inMemoryFallbackStore = new ConcurrentHashMap<>();
    private final Map<String, ConversationState> inMemoryStateStore = new ConcurrentHashMap<>();

    @Autowired
    public ConversationMemoryService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) ObjectMapper objectMapper
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public ConversationMemoryService() {
        this(null, new ObjectMapper());
    }

    private String buildRedisKey(User user, String conversationId) {
        String userIdStr = (user != null && user.getId() != null) ? String.valueOf(user.getId()) : "anon";
        String cleanConvId = (conversationId != null && !conversationId.trim().isEmpty()) ? conversationId.trim() : "default";
        return REDIS_KEY_PREFIX + userIdStr + ":" + cleanConvId;
    }

    private String buildRedisStateKey(User user, String conversationId) {
        String userIdStr = (user != null && user.getId() != null) ? String.valueOf(user.getId()) : "anon";
        String cleanConvId = (conversationId != null && !conversationId.trim().isEmpty()) ? conversationId.trim() : "default";
        return REDIS_STATE_PREFIX + userIdStr + ":" + cleanConvId;
    }

    /**
     * Get conversation chat history bound to authenticated user
     */
    public List<ChatMessageHistoryDto> getHistory(User user, String conversationId) {
        if (conversationId == null || conversationId.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String key = buildRedisKey(user, conversationId);

        if (redisTemplate != null) {
            try {
                String json = redisTemplate.opsForValue().get(key);

                if (json != null && !json.trim().isEmpty()) {
                    return objectMapper.readValue(json, new TypeReference<List<ChatMessageHistoryDto>>() {});
                }
                return new ArrayList<>();
            } catch (Exception e) {
                log.warn("Redis memory getHistory failed for key [{}], falling back to in-memory: {}", key, e.getMessage());
            }
        }

        // In-memory fallback
        List<ChatMessageHistoryDto> history = inMemoryFallbackStore.get(key);
        return history != null ? new ArrayList<>(history) : new ArrayList<>();
    }

    public List<ChatMessageHistoryDto> getHistory(String conversationId) {
        return getHistory(null, conversationId);
    }

    /**
     * Add user or assistant/model message to conversation history in Redis
     */
    public void addMessage(User user, String conversationId, String role, String content) {
        if (conversationId == null || conversationId.trim().isEmpty() || content == null || content.trim().isEmpty()) {
            return;
        }

        ChatMessageHistoryDto newMsg = ChatMessageHistoryDto.builder()
                .role(role != null ? role : "user")
                .content(content.trim())
                .build();

        String key = buildRedisKey(user, conversationId);

        if (redisTemplate != null) {
            try {
                List<ChatMessageHistoryDto> history = getHistoryFromRedisOnly(key);
                history.add(newMsg);

                String json = objectMapper.writeValueAsString(history);
                redisTemplate.opsForValue().set(key, json, CONVERSATION_TTL);
                return;
            } catch (Exception e) {
                log.warn("Redis memory addMessage failed for key [{}], falling back to in-memory: {}", key, e.getMessage());
            }
        }

        // In-memory fallback
        inMemoryFallbackStore.computeIfAbsent(key, id -> new CopyOnWriteArrayList<>()).add(newMsg);
    }

    public void addMessage(String conversationId, String role, String content) {
        addMessage(null, conversationId, role, content);
    }

    /**
     * Fetch ConversationState from Redis (or fallback RAM store)
     */
    public ConversationState getState(User user, String conversationId) {
        if (conversationId == null || conversationId.trim().isEmpty()) {
            return new ConversationState();
        }

        String stateKey = buildRedisStateKey(user, conversationId);
        if (redisTemplate != null) {
            try {
                String json = redisTemplate.opsForValue().get(stateKey);
                if (json != null && !json.trim().isEmpty()) {
                    return objectMapper.readValue(json, ConversationState.class);
                }
            } catch (Exception e) {
                log.warn("Redis getState failed for [{}], falling back to in-memory: {}", stateKey, e.getMessage());
            }
        }

        return inMemoryStateStore.getOrDefault(stateKey, new ConversationState());
    }

    /**
     * Save ConversationState to Redis (or fallback RAM store)
     */
    public void saveState(User user, String conversationId, ConversationState state) {
        if (conversationId == null || conversationId.trim().isEmpty() || state == null) {
            return;
        }

        String stateKey = buildRedisStateKey(user, conversationId);
        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(state);
                redisTemplate.opsForValue().set(stateKey, json, CONVERSATION_TTL);
                return;
            } catch (Exception e) {
                log.warn("Redis saveState failed for [{}], falling back to in-memory: {}", stateKey, e.getMessage());
            }
        }

        inMemoryStateStore.put(stateKey, state);
    }

    /**
     * Clear history & state for conversation bound to authenticated user
     */
    public void clearHistory(User user, String conversationId) {
        if (conversationId == null || conversationId.trim().isEmpty()) {
            return;
        }
        String key = buildRedisKey(user, conversationId);
        String stateKey = buildRedisStateKey(user, conversationId);
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(List.of(key, stateKey));
            } catch (Exception e) {
                log.warn("Redis memory clearHistory failed for key [{}]: {}", key, e.getMessage());
            }
        }
        inMemoryFallbackStore.remove(key);
        inMemoryStateStore.remove(stateKey);
    }

    public void clearHistory(String conversationId) {
        clearHistory(null, conversationId);
    }

    private List<ChatMessageHistoryDto> getHistoryFromRedisOnly(String redisKey) throws Exception {
        String json = redisTemplate.opsForValue().get(redisKey);
        if (json != null && !json.trim().isEmpty()) {
            return objectMapper.readValue(json, new TypeReference<List<ChatMessageHistoryDto>>() {});
        }
        return new ArrayList<>();
    }
}
