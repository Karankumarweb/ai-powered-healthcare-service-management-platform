package com.careflow.patient.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record PatientRequestDto(
        @NotNull(message = "User ID is required")
        Long userId,
        @NotBlank(message = "First name is required")
        String firstName,
        @NotBlank(message = "Last name is required")
        String lastName,
        @NotNull(message = "Date of birth is required")
        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,
        @NotBlank(message = "Gender is required")
        @Pattern(regexp = "MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY", message = "Invalid gender value")
        String gender,
        @NotBlank(message = "Phone is required")
        String phone,
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        String email,
        String address,
        String bloodGroup,
        String emergencyContact,
        String insuranceProvider
) {}
