package com.careflow.notification.service;

import com.careflow.notification.dto.CreateNotificationRequest;
import com.careflow.notification.dto.NotificationResponse;
import com.careflow.notification.entity.Notification;
import com.careflow.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    @Test
    void sendNotificationSavesAndMarksSent() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(10L);
            return n;
        });

        NotificationResponse res = notificationService.sendNotification(new CreateNotificationRequest(
                4L, "liam@careflow.test", 1L, "IN_APP", "APPOINTMENT_BOOKED",
                "Appointment Confirmed", "Visit scheduled for tomorrow."
        ));

        assertEquals(10L, res.id());
        assertEquals("SENT", res.deliveryStatus());
    }
}
