package com.careflow.patient.service;

import com.careflow.patient.dto.PatientRequestDto;
import com.careflow.patient.dto.PatientResponseDto;
import com.careflow.patient.entity.Patient;
import com.careflow.patient.exception.ResourceNotFoundException;
import com.careflow.patient.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock private PatientRepository patientRepository;
    @InjectMocks private PatientService patientService;

    @Test
    void createPatientPersistsAndReturnsDto() {
        PatientRequestDto req = new PatientRequestDto(
                10L, "Liam", "Miller", LocalDate.of(1991, 4, 18),
                "MALE", "+1-555-0211", "liam@careflow.test",
                "Seattle, WA", "O+", "Claire Miller", "BlueCross"
        );
        when(patientRepository.existsByEmail("liam@careflow.test")).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        PatientResponseDto res = patientService.createPatient(req);
        assertEquals(1L, res.id());
        assertEquals("Liam", res.firstName());
    }

    @Test
    void getPatientByIdThrowsWhenMissing() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> patientService.getPatientById(99L));
    }
}
