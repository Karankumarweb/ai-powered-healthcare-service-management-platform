package com.careflow.patient.dto;

import java.time.Instant;

public record ServiceRequestResponseDto(
        Long id,
        Long patientId,
        String patientName,
        String category,
        String subject,
        String description,
        String aiSummary,
        String priority,
        String status,
        Long assignedTo,
        Instant createdAt,
        Instant updatedAt
) {}
