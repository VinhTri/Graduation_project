package com.project.app.ai.repository;

import com.project.app.ai.rag.entity.AppKnowledgeChunkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppKnowledgeVectorRepository extends JpaRepository<AppKnowledgeChunkEntity, Long> {

    Optional<AppKnowledgeChunkEntity> findByContentHash(String contentHash);

    boolean existsByContentHash(String contentHash);

    List<AppKnowledgeChunkEntity> findByTopicIgnoreCase(String topic);

    /**
     * Native pgvector Cosine Distance Query with Hybrid Topic Metadata Filtering.
     * Order by (embedding <=> CAST(:embeddingStr AS vector)) ascending.
     */
    @Query(value = """
            SELECT * FROM app_knowledge_chunks c
            WHERE (:topic IS NULL OR :topic = 'GENERAL' OR LOWER(c.topic) = LOWER(:topic))
            ORDER BY c.embedding <=> CAST(:embeddingStr AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<AppKnowledgeChunkEntity> searchVectorSimilarity(
            @Param("embeddingStr") String embeddingStr,
            @Param("topic") String topic,
            @Param("limit") int limit
    );

    /**
     * Native pgvector Cosine Similarity Search with minimum similarity threshold filtering.
     * Cosine Similarity = (1 - Cosine Distance) >= minSimilarity.
     */
    @Query(value = """
            SELECT * FROM app_knowledge_chunks c
            WHERE (:topic IS NULL OR :topic = 'GENERAL' OR LOWER(c.topic) = LOWER(:topic))
              AND (1 - (c.embedding <=> CAST(:embeddingStr AS vector))) >= :minSimilarity
            ORDER BY c.embedding <=> CAST(:embeddingStr AS vector) ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<AppKnowledgeChunkEntity> searchVectorSimilarityWithThreshold(
            @Param("embeddingStr") String embeddingStr,
            @Param("topic") String topic,
            @Param("minSimilarity") double minSimilarity,
            @Param("limit") int limit
    );
}
