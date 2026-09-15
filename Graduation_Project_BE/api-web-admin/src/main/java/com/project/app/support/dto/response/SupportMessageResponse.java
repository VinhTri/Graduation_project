package com.project.app.support.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportMessageResponse {
    private Long id;
    private String content;
    private String senderType;
    private Long senderId;
    private String senderUsername;
    private LocalDateTime createdAt;
}
