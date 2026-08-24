package com.project.app.ai.security;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiRateLimiter {
    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_SECONDS = 60;
    private final Map<Long, Deque<Instant>> requests = new ConcurrentHashMap<>();

    public void check(Long userId) {
        if (userId == null) throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        Deque<Instant> queue = requests.computeIfAbsent(userId, ignored -> new ArrayDeque<>());
        synchronized (queue) {
            Instant threshold = Instant.now().minusSeconds(WINDOW_SECONDS);
            while (!queue.isEmpty() && queue.peekFirst().isBefore(threshold)) queue.removeFirst();
            if (queue.size() >= MAX_REQUESTS) throw new AppException(ErrorCode.AI_RATE_LIMIT_EXCEEDED);
            queue.addLast(Instant.now());
        }
    }
}
