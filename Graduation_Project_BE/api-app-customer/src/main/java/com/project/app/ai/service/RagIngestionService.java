package com.project.app.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.app.ai.rag.DocumentChunk;
import com.project.app.ai.rag.DocumentChunker;
import com.project.app.ai.rag.DocumentLoader;
import com.project.app.ai.rag.entity.AppKnowledgeChunkEntity;
import com.project.app.ai.repository.AppKnowledgeVectorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagIngestionService {

    private final DocumentLoader documentLoader;
    private final DocumentChunker documentChunker;
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final AppKnowledgeVectorRepository repository;
    private final ObjectMapper objectMapper;

    /**
     * Manual / On-Demand RAG Reindexing Endpoint execution (POST /admin/ai/rag/reindex)
     */
    public Map<String, Object> reindexAllDocuments() {
        List<DocumentChunk> rawChunks = documentLoader.loadDocumentChunks();
        Map<String, Object> result = new HashMap<>();

        if (rawChunks == null || rawChunks.isEmpty()) {
            log.info("No raw document chunks to ingest.");
            result.put("totalProcessed", 0);
            result.put("newIngested", 0);
            result.put("skipped", 0);
            result.put("message", "Không tìm thấy tài liệu nào để reindex");
            return result;
        }

        int newIngested = 0;
        int skipped = 0;

        for (DocumentChunk rawChunk : rawChunks) {
            try {
                DocumentChunk chunk = documentChunker.processChunk(rawChunk);
                String hash = documentChunker.calculateHash(chunk.getContent());

                if (repository != null && repository.existsByContentHash(hash)) {
                    skipped++;
                    continue;
                }

                log.info("Ingesting new RAG Chunk topic=[{}] type=[{}]...", chunk.getTopic(), chunk.getType());

                float[] vector = geminiEmbeddingService.embedText(chunk.getContent());
                if (vector == null || vector.length != 768) {
                    log.warn("Skip RAG chunk [{}] because embedding vector is invalid or empty (length={})",
                            chunk.getTopic(), vector != null ? vector.length : 0);
                    skipped++;
                    continue;
                }

                String pgVectorStr = geminiEmbeddingService.formatVectorForPg(vector);
                if (pgVectorStr == null || pgVectorStr.trim().isEmpty()) {
                    log.warn("Skip RAG chunk [{}] because formatted vector string is null or empty", chunk.getTopic());
                    skipped++;
                    continue;
                }

                String keywordsJson = null;
                if (chunk.getKeywords() != null && !chunk.getKeywords().isEmpty()) {
                    keywordsJson = objectMapper.writeValueAsString(chunk.getKeywords());
                }

                AppKnowledgeChunkEntity entity = AppKnowledgeChunkEntity.builder()
                        .topic(chunk.getTopic())
                        .type(chunk.getType())
                        .content(chunk.getContent())
                        .keywords(keywordsJson)
                        .contentHash(hash)
                        .embedding(vector)
                        .build();

                if (repository != null) {
                    repository.save(entity);
                }
                newIngested++;
            } catch (Exception e) {
                log.warn("Failed to ingest document chunk [{}]: {}", rawChunk.getTopic(), e.getMessage());
            }
        }

        log.info("RAG Reindexing complete: totalProcessed={}, newIngested={}, skipped={}",
                rawChunks.size(), newIngested, skipped);

        result.put("totalProcessed", rawChunks.size());
        result.put("newIngested", newIngested);
        result.put("skipped", skipped);
        result.put("message", String.format("Reindex RAG thành công: %d tài liệu mới, %d tài liệu đã tồn tại", newIngested, skipped));

        return result;
    }
}
