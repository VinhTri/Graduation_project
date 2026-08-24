package com.project.app.ai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="ai_feedback",uniqueConstraints=@UniqueConstraint(name="uk_ai_feedback_user_message",columnNames={"user_id","message_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiFeedback {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="message_id",nullable=false,length=64) private String messageId;
 @Column(nullable=false,length=12) private String rating;
 @Column(name="created_at",nullable=false) private LocalDateTime createdAt;
 @PrePersist void create(){createdAt=LocalDateTime.now();}
}
