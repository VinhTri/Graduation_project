package com.project.app.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="ai_interaction_logs", indexes=@Index(name="idx_ai_log_user_time", columnList="user_id, created_at"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiInteractionLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id", nullable=false) private Long userId;
    @Column(name="conversation_id", length=64) private String conversationId;
    @Column(name="module_type", length=32) private String moduleType;
    @Column(name="tool_name", length=80) private String toolName;
    @Column(nullable=false) private boolean success;
    @Column(name="duration_ms", nullable=false) private long durationMs;
    @Column(name="error_code", length=80) private String errorCode;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt;
    @PrePersist void create(){ createdAt=LocalDateTime.now(); }
}
