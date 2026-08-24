package com.project.app.access.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
public record AdminAccessRequest(@NotBlank @Pattern(regexp="SUPER_ADMIN|FINANCE_ADMIN|SUPPORT_ADMIN|CONTENT_ADMIN|ANALYST") String accessRole, boolean active) {}
