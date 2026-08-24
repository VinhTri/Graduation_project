package com.project.app.ai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="ai_category_drafts",uniqueConstraints=@UniqueConstraint(name="uk_ai_category_draft_user",columnNames="user_id"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AiCategoryDraftEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(nullable=false,length=20) private String label;
 @Column(name="group_id",nullable=false) private Long groupId;
 @Column(name="group_title",nullable=false,length=100) private String groupTitle;
 @Column(nullable=false,length=50) private String icon;
 @Column(nullable=false,length=20) private String color;
 @Column(name="bg_color",nullable=false,length=20) private String bgColor;
 @Column(name="expires_at",nullable=false) private Instant expiresAt;
}
