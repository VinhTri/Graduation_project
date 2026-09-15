package com.project.app.ai.tool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolResultDto {
    private String toolName;
    private boolean success;
    private String message;
    private Map<String, Object> data;
}
