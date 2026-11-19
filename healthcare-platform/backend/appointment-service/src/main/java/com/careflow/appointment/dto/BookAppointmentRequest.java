package com.careflow.appointment.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookAppointmentRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        @NotNull @FutureOrPresent(message = "Appointment date cannot be in the past") LocalDate appointmentDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Pattern(regexp = "IN_PERSON|VIDEO_TELEHEALTH") String visitType,
        @NotBlank(message = "Visit reason is required") String reason,
        String notes
) {}
