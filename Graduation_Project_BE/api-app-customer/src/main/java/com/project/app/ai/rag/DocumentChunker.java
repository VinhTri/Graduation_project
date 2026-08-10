package com.project.app.ai.rag;

import com.project.app.ai.util.TextNormalizer;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

@Component
public class DocumentChunker {

    /**
     * Chunk and normalize document chunks for embedding and vector storage
     */
    public DocumentChunk processChunk(DocumentChunk rawChunk) {
        if (rawChunk == null) return null;

        String cleanedContent = TextNormalizer.normalizeWhitespace(rawChunk.getContent());

        return DocumentChunk.builder()
                .topic(rawChunk.getTopic() != null ? rawChunk.getTopic().toUpperCase() : "GENERAL")
                .type(rawChunk.getType() != null ? rawChunk.getType().toUpperCase() : "APP_GUIDE")
                .content(cleanedContent)
                .keywords(rawChunk.getKeywords() != null ? rawChunk.getKeywords() : new ArrayList<>())
                .build();
    }

    /**
     * Calculate SHA-256 hash string of text content for uniqueness check
     */
    public String calculateHash(String content) {
        if (content == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(content.hashCode());
        }
    }
}
