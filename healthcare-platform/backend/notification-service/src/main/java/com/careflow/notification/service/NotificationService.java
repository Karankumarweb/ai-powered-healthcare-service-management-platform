package com.careflow.notification.service;

import com.careflow.notification.dto.CreateNotificationRequest;
import com.careflow.notification.dto.NotificationResponse;
import com.careflow.notification.entity.Notification;
import com.careflow.notification.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public NotificationResponse sendNotification(CreateNotificationRequest req) {
        Notification notification = new Notification();
        notification.setRecipientId(req.recipientId());
        notification.setRecipientEmail(req.recipientEmail());
        notification.setAppointmentId(req.appointmentId());
        notification.setChannel(req.channel() != null ? req.channel() : "IN_APP");
        notification.setEventType(req.eventType());
        notification.setTitle(req.title());
        notification.setMessage(req.message());
        notification.setDeliveryStatus("SENT");
        return toDto(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getForUser(Long recipientId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        n.setRead(true);
        return toDto(notificationRepository.save(n));
    }

    private NotificationResponse toDto(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getRecipientId(), n.getRecipientEmail(), n.getAppointmentId(),
                n.getChannel(), n.getEventType(), n.getTitle(), n.getMessage(),
                n.isRead(), n.getDeliveryStatus(), n.getSentAt()
        );
    }
}
