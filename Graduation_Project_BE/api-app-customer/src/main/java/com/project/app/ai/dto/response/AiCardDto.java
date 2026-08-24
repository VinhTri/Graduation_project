package com.project.app.ai.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiCardDto {
    private String type;
    private String title;
    private List<AiCardItemDto> items;
}
