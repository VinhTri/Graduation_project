package com.project.app.ai.service;

import com.project.app.ai.dto.response.HomeInsightResponse;
import com.project.app.ai.insight.FinanceInsightService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiInsightServiceImpl implements AiInsightService {

    private final FinanceInsightService financeInsightService;

    @Override
    public HomeInsightResponse getHomeInsight(User user) {
        return financeInsightService.buildHomeInsight(user);
    }
}
