package com.careflow.notification.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        Long recipientId,
        String recipientEmail,
        Long appointmentId,
        String channel,
        String eventType,
        String title,
        String message,
        boolean read,
        String deliveryStatus,
        Instant sentAt
) {}
