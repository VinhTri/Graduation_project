package com.project.app.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="ai_conversation_messages", indexes=@Index(name="idx_ai_message_conversation", columnList="conversation_id, created_at"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiConversationMessage {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="conversation_id", nullable=false) private AiConversation conversation;
    @Column(nullable=false, length=16) private String role;
    @Column(nullable=false, length=4000) private String content;
    @Column(name="module_type", length=32) private String moduleType;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt;
    @PrePersist void create(){ createdAt=LocalDateTime.now(); }
}
