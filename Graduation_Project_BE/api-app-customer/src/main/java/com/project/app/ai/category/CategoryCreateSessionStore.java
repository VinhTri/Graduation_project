package com.project.app.ai.category;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CategoryCreateSessionStore {

    private static final Duration TTL = Duration.ofMinutes(15);

    private final Map<Long, CategoryCreateDraft> sessions = new ConcurrentHashMap<>();

    public void save(Long userId, CategoryCreateDraft draft) {
        if (userId == null || draft == null) {
            return;
        }
        draft.setCreatedAt(Instant.now());
        sessions.put(userId, draft);
    }

    public Optional<CategoryCreateDraft> get(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        CategoryCreateDraft draft = sessions.get(userId);
        if (draft == null) {
            return Optional.empty();
        }
        if (draft.getCreatedAt() != null && draft.getCreatedAt().isBefore(Instant.now().minus(TTL))) {
            sessions.remove(userId);
            return Optional.empty();
        }
        return Optional.of(draft);
    }

    public void clear(Long userId) {
        if (userId != null) {
            sessions.remove(userId);
        }
    }
}
