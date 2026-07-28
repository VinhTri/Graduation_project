package com.project.app.ai.service;

import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.request.FeedbackRequest;
import com.project.app.ai.dto.request.IngestDocumentRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.dto.response.HistoryResponse;
import com.project.app.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AiService {

    AiChatResponse chat(User user, AiChatRequest request);

    List<HistoryResponse> getConversationHistory(User user);

    List<AiChatResponse> getConversationMessages(User user, Long conversationId);

    void deleteConversation(User user, Long conversationId);

    void submitFeedback(User user, FeedbackRequest request);

    void ingestDocument(IngestDocumentRequest request);
}
