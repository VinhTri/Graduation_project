package com.project.app.ai.service;

import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import com.project.app.ai.entity.AiConversation;
import com.project.app.ai.entity.AiConversationMessage;
import com.project.app.ai.repository.AiConversationMessageRepository;
import com.project.app.ai.repository.AiConversationRepository;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class AiConversationService {
    private final AiConversationRepository conversations;
    private final AiConversationMessageRepository messages;

    @Transactional
    public AiConversation resolve(User user,String publicId,String firstMessage){
        if(publicId!=null&&!publicId.isBlank()){
            Optional<AiConversation> found=conversations.findByPublicIdAndUserId(publicId,user.getId());
            if(found.isPresent()) return found.get();
        }
        String title=firstMessage.length()>80?firstMessage.substring(0,80):firstMessage;
        return conversations.save(AiConversation.builder().publicId(UUID.randomUUID().toString()).user(user).title(title).build());
    }

    @Transactional(readOnly=true)
    public List<ChatMessageHistoryDto> history(AiConversation conversation){
        List<AiConversationMessage> rows=new ArrayList<>(messages.findTop20ByConversationIdOrderByCreatedAtDesc(conversation.getId()));
        Collections.reverse(rows);
        return rows.stream().map(row->{ ChatMessageHistoryDto dto=new ChatMessageHistoryDto(); dto.setRole(row.getRole()); dto.setContent(row.getContent()); return dto; }).toList();
    }

    @Transactional
    public void append(AiConversation conversation,String role,String content,String moduleType){
        messages.save(AiConversationMessage.builder().conversation(conversation).role(role).content(content).moduleType(moduleType).build());
        conversations.save(conversation);
    }
}
