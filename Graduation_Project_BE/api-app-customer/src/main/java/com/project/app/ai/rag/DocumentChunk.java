package com.project.app.ai.rag;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentChunk {
    private String topic;
    private String type;
    private String content;
    private List<String> keywords;
}
