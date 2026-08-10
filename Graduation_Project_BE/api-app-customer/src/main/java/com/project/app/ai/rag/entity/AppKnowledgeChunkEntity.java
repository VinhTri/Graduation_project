package com.project.app.ai.rag.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_knowledge_chunks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppKnowledgeChunkEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String topic;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String keywords;

    @Column(name = "content_hash", nullable = false, unique = true, length = 64)
    private String contentHash;

    @JdbcTypeCode(SqlTypes.VECTOR)
    @Column(columnDefinition = "vector(768)", nullable = false)
    private float[] embedding;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
