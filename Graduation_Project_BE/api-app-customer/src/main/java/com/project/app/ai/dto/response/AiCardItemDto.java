package com.project.app.ai.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiCardItemDto {
    private String label;
    private String value;
    private String color;
}
