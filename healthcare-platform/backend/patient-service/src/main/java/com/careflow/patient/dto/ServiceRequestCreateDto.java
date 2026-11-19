package com.careflow.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ServiceRequestCreateDto(
        @NotNull(message = "Patient ID is required")
        Long patientId,
        @NotBlank(message = "Category is required")
        String category,
        @NotBlank(message = "Subject is required")
        String subject,
        @NotBlank(message = "Description is required")
        String description,
        String aiSummary,
        @Pattern(regexp = "LOW|MEDIUM|HIGH|URGENT", message = "Invalid priority")
        String priority
) {}
