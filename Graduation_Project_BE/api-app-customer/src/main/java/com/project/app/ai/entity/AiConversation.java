package com.project.app.ai.entity;

import com.project.app.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="ai_conversations", indexes=@Index(name="idx_ai_conversation_user", columnList="user_id, updated_at"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiConversation {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id", nullable=false, unique=true, length=64) private String publicId;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false) private User user;
    @Column(length=160) private String title;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt;
    @Column(name="updated_at", nullable=false) private LocalDateTime updatedAt;
    @PrePersist void create(){ LocalDateTime now=LocalDateTime.now(); createdAt=now; updatedAt=now; }
    @PreUpdate void update(){ updatedAt=LocalDateTime.now(); }
}
