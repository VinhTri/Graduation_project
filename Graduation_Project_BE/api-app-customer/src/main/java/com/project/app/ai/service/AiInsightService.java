package com.project.app.ai.service;

import com.project.app.ai.dto.response.HomeInsightResponse;
import com.project.app.user.entity.User;

public interface AiInsightService {
    HomeInsightResponse getHomeInsight(User user);
}
