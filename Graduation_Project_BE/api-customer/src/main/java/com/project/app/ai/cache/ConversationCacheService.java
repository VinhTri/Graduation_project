package com.project.app.ai.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.app.ai.entity.AiMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // Thread-safe in-memory fallback cache
    private final Map<String, LocalCacheEntry> memoryCache = new ConcurrentHashMap<>();

    private static final String KEY_PREFIX = "ai:session:";
    private static final long TTL_MINUTES = 30;

    public void cacheHistory(Long userId, Long conversationId, List<AiMessage> messages) {
        String key = KEY_PREFIX + userId + ":" + conversationId;
        try {
            // Pick only key attributes to keep cache compact
            List<Map<String, String>> compactMsgs = messages.stream()
                    .map(m -> Map.of(
                            "sender", m.getSender(),
                            "content", m.getContent() != null ? m.getContent() : ""
                    ))
                    .toList();

            String jsonVal = objectMapper.writeValueAsString(compactMsgs);

            // Attempt to write to Redis
            try {
                redisTemplate.opsForValue().set(key, jsonVal, TTL_MINUTES, TimeUnit.MINUTES);
                log.info("Cached conversation history in Redis under key: {}", key);
            } catch (Exception e) {
                log.warn("Redis write failed, falling back to local memory cache for key: {}", key, e);
                memoryCache.put(key, new LocalCacheEntry(jsonVal, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(TTL_MINUTES)));
            }

        } catch (Exception e) {
            log.error("Failed to serialize conversation history for cache", e);
        }
    }

    public List<Map<String, String>> getCachedHistory(Long userId, Long conversationId) {
        String key = KEY_PREFIX + userId + ":" + conversationId;
        String jsonVal = null;

        // Try Redis first
        try {
            jsonVal = redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis read failed, trying local memory cache for key: {}", key);
        }

        // Fallback to local memory if Redis returned nothing
        if (jsonVal == null) {
            LocalCacheEntry entry = memoryCache.get(key);
            if (entry != null) {
                if (entry.isExpired()) {
                    memoryCache.remove(key);
                } else {
                    jsonVal = entry.value;
                }
            }
        }

        if (jsonVal == null) {
            return null;
        }

        try {
            return objectMapper.readValue(jsonVal, new TypeReference<List<Map<String, String>>>() {});
        } catch (Exception e) {
            log.error("Failed to parse cached conversation history", e);
            return null;
        }
    }

    public void invalidate(Long userId, Long conversationId) {
        String key = KEY_PREFIX + userId + ":" + conversationId;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Redis delete failed for key: {}", key);
        }
        memoryCache.remove(key);
    }

    private static class LocalCacheEntry {
        final String value;
        final long expiryTime;

        LocalCacheEntry(String value, long expiryTime) {
            this.value = value;
            this.expiryTime = expiryTime;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }
}
