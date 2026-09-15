package com.project.app.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeInsightResponse {
    private String message;
    private String periodLabel;
    private String insightType;
    private List<String> hints;
}
