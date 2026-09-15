package com.project.app.ai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity @Table(name="ai_pending_actions",uniqueConstraints=@UniqueConstraint(name="uk_ai_pending_user",columnNames="user_id"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiPendingAction {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(nullable=false,length=32) private String type;
 @Column(length=200) private String subject;
 @Column(length=2000) private String content;
 @Column(name="category_id") private Long categoryId;
 @Column(precision=19,scale=2) private BigDecimal amount;
 @Column(name="start_date") private LocalDate startDate;
 @Column(name="end_date") private LocalDate endDate;
 @Column(name="expires_at",nullable=false) private LocalDateTime expiresAt;
}
