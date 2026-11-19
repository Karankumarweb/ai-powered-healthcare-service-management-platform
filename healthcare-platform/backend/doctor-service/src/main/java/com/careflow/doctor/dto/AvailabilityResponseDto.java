package com.careflow.doctor.dto;

import java.time.LocalTime;

public record AvailabilityResponseDto(
        Long id,
        String dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        int slotDurationMinutes,
        boolean available
) {}
