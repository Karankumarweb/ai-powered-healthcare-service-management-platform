package com.careflow.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record SummarizeRequestDto(
        @NotBlank String category,
        @NotBlank String subject,
        @NotBlank String description,
        boolean consentToProcess
) {}
