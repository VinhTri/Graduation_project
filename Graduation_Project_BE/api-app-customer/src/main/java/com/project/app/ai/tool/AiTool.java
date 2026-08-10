package com.project.app.ai.tool;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.user.entity.User;

import java.util.Map;

public interface AiTool {
    String getName();
    String getDescription();
    Map<String, Object> getFunctionDeclaration();
    ToolResultDto execute(User user, Map<String, Object> arguments);
}
