package com.careflow.appointment.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class ServiceClients {

    private final RestClient restClient = RestClient.create();

    @Value("${services.patient-url:http://localhost:8082}")
    private String patientUrl;

    @Value("${services.doctor-url:http://localhost:8083}")
    private String doctorUrl;

    @Value("${services.notification-url:http://localhost:8085}")
    private String notificationUrl;

    public record PatientSummary(Long id, Long userId, String firstName, String lastName, String email) {}
    public record DoctorSummary(Long id, Long userId, String firstName, String lastName, String specialization, boolean acceptingPatients) {}
    public record AvailabilitySlot(Long id, String dayOfWeek, LocalTime startTime, LocalTime endTime, int slotDurationMinutes, boolean available) {}

    public PatientSummary fetchPatient(Long patientId, String bearerToken) {
        return restClient.get()
                .uri(patientUrl + "/api/v1/patients/{id}", patientId)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .retrieve()
                .body(PatientSummary.class);
    }

    public DoctorSummary fetchDoctor(Long doctorId) {
        return restClient.get()
                .uri(doctorUrl + "/api/v1/doctors/{id}", doctorId)
                .retrieve()
                .body(DoctorSummary.class);
    }

    public List<AvailabilitySlot> fetchDoctorAvailability(Long doctorId) {
        AvailabilitySlot[] slots = restClient.get()
                .uri(doctorUrl + "/api/v1/doctors/{id}/availability", doctorId)
                .retrieve()
                .body(AvailabilitySlot[].class);
        return slots == null ? List.of() : Arrays.asList(slots);
    }

    public void sendNotification(Map<String, Object> payload, String bearerToken) {
        try {
            restClient.post()
                    .uri(notificationUrl + "/api/v1/notifications")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ignored) {
            // Notification delivery failures are logged without rolling back clinical bookings
        }
    }
}
