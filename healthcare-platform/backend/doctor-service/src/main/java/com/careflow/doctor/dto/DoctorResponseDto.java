package com.careflow.doctor.dto;

import java.math.BigDecimal;
import java.util.List;

public record DoctorResponseDto(
        Long id,
        Long userId,
        String firstName,
        String lastName,
        String email,
        String phone,
        String specialization,
        String licenseNumber,
        int yearsExperience,
        BigDecimal consultationFee,
        String department,
        String bio,
        boolean acceptingPatients,
        List<AvailabilityResponseDto> availabilities
) {}
