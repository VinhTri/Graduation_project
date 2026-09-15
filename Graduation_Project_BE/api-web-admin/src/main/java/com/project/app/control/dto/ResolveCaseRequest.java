package com.project.app.control.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveCaseRequest(@NotBlank @Size(min = 10, max = 1000) String resolutionNote) {}
