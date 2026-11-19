package com.careflow.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationRequest(
        @NotNull Long recipientId,
        @NotBlank @Email String recipientEmail,
        Long appointmentId,
        String channel,
        @NotBlank String eventType,
        @NotBlank String title,
        @NotBlank String message
) {}
