package com.careflow.appointment.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String visitType,
        String reason,
        String notes,
        String status,
        String cancellationReason,
        Instant createdAt,
        Instant updatedAt
) {}
