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
public class ToolCallDto {
    private String id;
    private String name;
    private Map<String, Object> arguments;
    private String thoughtSignature;
}
