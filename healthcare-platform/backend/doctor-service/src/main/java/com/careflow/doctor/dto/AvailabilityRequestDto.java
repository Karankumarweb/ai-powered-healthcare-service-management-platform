package com.careflow.doctor.dto;

import jakarta.validation.constraints.*;
import java.time.LocalTime;

public record AvailabilityRequestDto(
        @NotBlank
        @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY")
        String dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(15) @Max(120) int slotDurationMinutes,
        boolean available
) {}
