package com.project.app.control.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FinanceCaseRequest(
        @Size(max = 100) String transactionCode,
        @NotBlank @Pattern(regexp = "CRITICAL|HIGH|MEDIUM|LOW") String severity,
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(min = 10, max = 1000) String description) {}
