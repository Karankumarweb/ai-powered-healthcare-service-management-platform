package com.careflow.appointment.service;

import com.careflow.appointment.client.ServiceClients;
import com.careflow.appointment.dto.AppointmentResponse;
import com.careflow.appointment.dto.BookAppointmentRequest;
import com.careflow.appointment.dto.RescheduleAppointmentRequest;
import com.careflow.appointment.entity.Appointment;
import com.careflow.appointment.exception.SlotConflictException;
import com.careflow.appointment.repository.AppointmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceClients serviceClients;

    public AppointmentService(AppointmentRepository appointmentRepository, ServiceClients serviceClients) {
        this.appointmentRepository = appointmentRepository;
        this.serviceClients = serviceClients;
    }

    @Transactional
    public AppointmentResponse bookAppointment(BookAppointmentRequest req, String bearerToken) {
        validateTimeRange(req.startTime(), req.endTime());

        ServiceClients.PatientSummary patient = serviceClients.fetchPatient(req.patientId(), bearerToken);
        ServiceClients.DoctorSummary doctor = serviceClients.fetchDoctor(req.doctorId());
        if (doctor == null || !doctor.acceptingPatients()) {
            throw new IllegalArgumentException("Selected doctor is currently not accepting new bookings");
        }

        verifyDoctorWindow(req.doctorId(), req.appointmentDate(), req.startTime(), req.endTime());

        if (appointmentRepository.existsOverlappingAppointment(
                req.doctorId(), req.appointmentDate(), req.startTime(), req.endTime(), null)) {
            throw new SlotConflictException("This time slot overlaps with an existing appointment for Dr. " + doctor.lastName());
        }

        Appointment appointment = new Appointment();
        appointment.setPatientId(req.patientId());
        appointment.setDoctorId(req.doctorId());
        appointment.setAppointmentDate(req.appointmentDate());
        appointment.setStartTime(req.startTime());
        appointment.setEndTime(req.endTime());
        appointment.setVisitType(req.visitType() != null ? req.visitType() : "IN_PERSON");
        appointment.setReason(req.reason().trim());
        appointment.setNotes(req.notes());
        appointment.setStatus("CONFIRMED");

        Appointment saved = appointmentRepository.save(appointment);

        if (patient != null) {
            serviceClients.sendNotification(Map.of(
                    "recipientId", patient.userId(),
                    "recipientEmail", patient.email(),
                    "appointmentId", saved.getId(),
                    "channel", "IN_APP",
                    "eventType", "APPOINTMENT_BOOKED",
                    "title", "Appointment Confirmed with Dr. " + doctor.firstName() + " " + doctor.lastName(),
                    "message", "Scheduled for " + saved.getAppointmentDate() + " at " + saved.getStartTime() + "."
            ), bearerToken);
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        return appointmentRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getByPatient(Long patientId, Pageable pageable) {
        return appointmentRepository.findByPatientId(patientId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getByDoctor(Long doctorId, Pageable pageable) {
        return appointmentRepository.findByDoctorId(doctorId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAll(Pageable pageable) {
        return appointmentRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public AppointmentResponse reschedule(Long id, RescheduleAppointmentRequest req, String bearerToken) {
        validateTimeRange(req.startTime(), req.endTime());
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));

        if ("CANCELLED".equals(appt.getStatus()) || "COMPLETED".equals(appt.getStatus())) {
            throw new IllegalArgumentException("Cannot reschedule a completed or cancelled appointment");
        }

        verifyDoctorWindow(appt.getDoctorId(), req.appointmentDate(), req.startTime(), req.endTime());

        if (appointmentRepository.existsOverlappingAppointment(
                appt.getDoctorId(), req.appointmentDate(), req.startTime(), req.endTime(), appt.getId())) {
            throw new SlotConflictException("Requested reschedule time overlaps with an existing appointment");
        }

        appt.setAppointmentDate(req.appointmentDate());
        appt.setStartTime(req.startTime());
        appt.setEndTime(req.endTime());
        appt.setStatus("RESCHEDULED");
        return toDto(appointmentRepository.save(appt));
    }

    @Transactional
    public AppointmentResponse cancel(Long id, String reason, String bearerToken) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        appt.setStatus("CANCELLED");
        appt.setCancellationReason(reason != null ? reason.trim() : "Cancelled by user");
        Appointment saved = appointmentRepository.save(appt);

        ServiceClients.PatientSummary patient = serviceClients.fetchPatient(appt.getPatientId(), bearerToken);
        if (patient != null) {
            serviceClients.sendNotification(Map.of(
                    "recipientId", patient.userId(),
                    "recipientEmail", patient.email(),
                    "appointmentId", saved.getId(),
                    "channel", "IN_APP",
                    "eventType", "APPOINTMENT_CANCELLED",
                    "title", "Appointment Cancelled",
                    "message", "Your appointment on " + saved.getAppointmentDate() + " was cancelled."
            ), bearerToken);
        }

        return toDto(saved);
    }

    private void verifyDoctorWindow(Long doctorId, LocalDate date, LocalTime start, LocalTime end) {
        List<ServiceClients.AvailabilitySlot> slots = serviceClients.fetchDoctorAvailability(doctorId);
        if (slots.isEmpty()) {
            return;
        }
        String dayName = date.getDayOfWeek().name();
        boolean matchesWindow = slots.stream().anyMatch(s ->
                s.available()
                        && s.dayOfWeek().equalsIgnoreCase(dayName)
                        && !start.isBefore(s.startTime())
                        && !end.isAfter(s.endTime())
        );
        if (!matchesWindow) {
            throw new IllegalArgumentException("Doctor is unavailable on " + dayName + " between " + start + " and " + end);
        }
    }

    private void validateTimeRange(LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    private AppointmentResponse toDto(Appointment a) {
        return new AppointmentResponse(
                a.getId(), a.getPatientId(), a.getDoctorId(),
                a.getAppointmentDate(), a.getStartTime(), a.getEndTime(),
                a.getVisitType(), a.getReason(), a.getNotes(), a.getStatus(),
                a.getCancellationReason(), a.getCreatedAt(), a.getUpdatedAt()
        );
    }
}
