package com.careflow.patient.dto;

import java.time.Instant;
import java.time.LocalDate;

public record PatientResponseDto(
        Long id,
        Long userId,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        String gender,
        String phone,
        String email,
        String address,
        String bloodGroup,
        String emergencyContact,
        String insuranceProvider,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
