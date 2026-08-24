package com.project.app.ai.category;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class CategoryCreateDraft {
    private String label;
    private Long groupId;
    private String groupTitle;
    private String icon;
    private String color;
    private String bgColor;
    private Instant createdAt;
}
