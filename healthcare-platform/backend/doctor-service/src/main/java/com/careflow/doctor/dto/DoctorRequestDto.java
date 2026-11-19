package com.careflow.doctor.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record DoctorRequestDto(
        @NotNull Long userId,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotBlank String specialization,
        @NotBlank String licenseNumber,
        @Min(0) int yearsExperience,
        @NotNull @DecimalMin("0.00") BigDecimal consultationFee,
        @NotBlank String department,
        String bio,
        Boolean acceptingPatients
) {}
