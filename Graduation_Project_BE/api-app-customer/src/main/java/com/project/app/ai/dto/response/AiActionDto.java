package com.project.app.ai.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiActionDto {
    private String id;
    private String label;
    private String type;
    private String route;
    private String payload;
}
