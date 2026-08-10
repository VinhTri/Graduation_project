package com.project.app.ai.rag;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.app.ai.rag.entity.AppKnowledgeChunkEntity;
import com.project.app.ai.repository.AppKnowledgeVectorRepository;
import com.project.app.ai.service.GeminiEmbeddingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AppKnowledgeService {

    private final DocumentLoader documentLoader;
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final AppKnowledgeVectorRepository vectorRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public AppKnowledgeService(
            DocumentLoader documentLoader,
            @Autowired(required = false) GeminiEmbeddingService geminiEmbeddingService,
            @Autowired(required = false) AppKnowledgeVectorRepository vectorRepository,
            @Autowired(required = false) ObjectMapper objectMapper
    ) {
        this.documentLoader = documentLoader;
        this.geminiEmbeddingService = geminiEmbeddingService;
        this.vectorRepository = vectorRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public AppKnowledgeService(DocumentLoader documentLoader) {
        this(documentLoader, null, null, new ObjectMapper());
    }

    /**
     * Vector Similarity Search with Hybrid Topic Metadata Filtering
     */
    public List<DocumentChunk> searchRelevantChunks(String query, String targetTopic) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Try Vector RAG Search via pgvector if available
        if (geminiEmbeddingService != null && vectorRepository != null) {
            try {
                float[] queryVector = geminiEmbeddingService.embedText(query);
                if (queryVector != null && queryVector.length > 0) {
                    String vectorStr = geminiEmbeddingService.formatVectorForPg(queryVector);
                    // Require minimum 45% similarity threshold (minSimilarity = 0.45) to prevent returning irrelevant chunks
                    List<AppKnowledgeChunkEntity> entities = vectorRepository.searchVectorSimilarityWithThreshold(vectorStr, targetTopic, 0.45, 3);

                    if (entities != null && !entities.isEmpty()) {
                        List<DocumentChunk> vectorChunks = new ArrayList<>();
                        for (AppKnowledgeChunkEntity e : entities) {
                            List<String> keywords = Collections.emptyList();
                            if (e.getKeywords() != null && !e.getKeywords().isEmpty()) {
                                try {
                                    keywords = objectMapper.readValue(e.getKeywords(), new TypeReference<List<String>>() {});
                                } catch (Exception ex) {
                                    keywords = List.of(e.getKeywords().split(","));
                                }
                            }

                            vectorChunks.add(DocumentChunk.builder()
                                    .topic(e.getTopic())
                                    .type(e.getType())
                                    .content(e.getContent())
                                    .keywords(keywords)
                                    .build());
                        }
                        return vectorChunks;
                    }
                }
            } catch (Exception e) {
                log.warn("Vector RAG search failed, falling back to local topic loader: {}", e.getMessage());
            }
        }

        // 2. Local Fallback Search (Topic Metadata & Keyword Fallback)
        List<DocumentChunk> allChunks = documentLoader != null ? documentLoader.loadDocumentChunks() : Collections.emptyList();
        if (allChunks.isEmpty()) {
            return Collections.emptyList();
        }

        // Topic Metadata Filter
        if (targetTopic != null && !"GENERAL".equalsIgnoreCase(targetTopic)) {
            List<DocumentChunk> filtered = new ArrayList<>();
            for (DocumentChunk chunk : allChunks) {
                if ("WALLET_DEPOSIT_AND_WITHDRAW".equalsIgnoreCase(targetTopic)) {
                    if ("WALLET_DEPOSIT".equalsIgnoreCase(chunk.getTopic()) || "WALLET_WITHDRAW".equalsIgnoreCase(chunk.getTopic())) {
                        filtered.add(chunk);
                    }
                } else if (targetTopic.equalsIgnoreCase(chunk.getTopic())) {
                    filtered.add(chunk);
                }
            }
            if (!filtered.isEmpty()) {
                return filtered.stream().limit(3).collect(Collectors.toList());
            }
        }

        // Text matching fallback
        String normQuery = removeAccents(query);
        List<ChunkScore> scoredList = new ArrayList<>();
        for (DocumentChunk chunk : allChunks) {
            if (!"APP_GUIDE".equalsIgnoreCase(chunk.getType())) {
                continue;
            }

            int score = calculateScore(normQuery, targetTopic, chunk);
            if (score >= 5) {
                scoredList.add(new ChunkScore(chunk, score));
            }
        }

        scoredList.sort((a, b) -> Integer.compare(b.score, a.score));

        if (scoredList.isEmpty()) {
            return Collections.emptyList();
        }

        return scoredList.stream()
                .limit(3)
                .map(cs -> cs.chunk)
                .collect(Collectors.toList());
    }

    public List<String> searchRelevantDocs(String query) {
        List<DocumentChunk> chunks = searchRelevantChunks(query, null);
        return chunks.stream().map(DocumentChunk::getContent).collect(Collectors.toList());
    }

    private int calculateScore(String normQuery, String targetTopic, DocumentChunk chunk) {
        int score = 0;
        String normContent = removeAccents(chunk.getContent());

        if (chunk.getKeywords() != null) {
            for (String kw : chunk.getKeywords()) {
                String normKw = removeAccents(kw);
                if (normQuery.contains(normKw)) {
                    score += 5;
                }
            }
        }

        String[] words = normQuery.split("\\s+");
        for (String w : words) {
            if (w.length() > 2 && normContent.contains(w)) {
                score += 1;
            }
        }

        return score;
    }

    private String removeAccents(String text) {
        if (text == null) return "";
        String temp = Normalizer.normalize(text, Normalizer.Form.NFD);
        return temp.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replace("đ", "d")
                .trim();
    }

    private static class ChunkScore {
        DocumentChunk chunk;
        int score;

        ChunkScore(DocumentChunk chunk, int score) {
            this.chunk = chunk;
            this.score = score;
        }
    }
}
