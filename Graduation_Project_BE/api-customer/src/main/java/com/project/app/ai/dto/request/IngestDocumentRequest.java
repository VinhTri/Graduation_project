package com.project.app.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngestDocumentRequest {

    @NotBlank(message = "Document ID cannot be blank")
    private String docId;

    @NotBlank(message = "Title cannot be blank")
    private String title;

    @NotBlank(message = "Snippet cannot be blank")
    private String snippet;

    private String url;
}
