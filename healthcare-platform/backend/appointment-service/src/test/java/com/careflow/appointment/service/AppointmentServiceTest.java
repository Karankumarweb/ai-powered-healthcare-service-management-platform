package com.careflow.appointment.service;

import com.careflow.appointment.client.ServiceClients;
import com.careflow.appointment.dto.BookAppointmentRequest;
import com.careflow.appointment.exception.SlotConflictException;
import com.careflow.appointment.repository.AppointmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private ServiceClients serviceClients;
    @InjectMocks private AppointmentService appointmentService;

    @Test
    void bookAppointmentPreventsOverlappingDoubleBooking() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        BookAppointmentRequest req = new BookAppointmentRequest(
                1L, 2L, nextMonday, LocalTime.of(9, 30), LocalTime.of(10, 0),
                "IN_PERSON", "Annual cardiology checkup", null
        );

        when(serviceClients.fetchPatient(1L, "Bearer test"))
                .thenReturn(new ServiceClients.PatientSummary(1L, 4L, "Liam", "Miller", "liam@test.com"));
        when(serviceClients.fetchDoctor(2L))
                .thenReturn(new ServiceClients.DoctorSummary(2L, 2L, "Aarav", "Patel", "Cardiology", true));
        when(serviceClients.fetchDoctorAvailability(2L))
                .thenReturn(List.of(new ServiceClients.AvailabilitySlot(
                        1L, "MONDAY", LocalTime.of(9, 0), LocalTime.of(13, 0), 30, true)));
        when(appointmentRepository.existsOverlappingAppointment(
                2L, nextMonday, LocalTime.of(9, 30), LocalTime.of(10, 0), null))
                .thenReturn(true);

        assertThrows(SlotConflictException.class, () -> appointmentService.bookAppointment(req, "Bearer test"));
        verify(appointmentRepository, never()).save(any());
    }
}
