package com.careflow.doctor.service;

import com.careflow.doctor.dto.AvailabilityRequestDto;
import com.careflow.doctor.entity.Doctor;
import com.careflow.doctor.repository.DoctorAvailabilityRepository;
import com.careflow.doctor.repository.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock private DoctorRepository doctorRepository;
    @Mock private DoctorAvailabilityRepository availabilityRepository;
    @InjectMocks private DoctorService doctorService;

    @Test
    void updateAvailabilityRejectsInvalidTimeWindow() {
        Doctor doc = new Doctor();
        doc.setId(1L);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doc));

        List<AvailabilityRequestDto> invalid = List.of(
                new AvailabilityRequestDto("MONDAY", LocalTime.of(14, 0), LocalTime.of(10, 0), 30, true)
        );

        assertThrows(IllegalArgumentException.class, () -> doctorService.updateAvailability(1L, invalid));
    }
}
