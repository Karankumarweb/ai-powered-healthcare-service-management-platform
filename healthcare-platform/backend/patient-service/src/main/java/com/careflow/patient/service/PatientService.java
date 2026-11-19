package com.careflow.patient.service;

import com.careflow.patient.dto.PatientRequestDto;
import com.careflow.patient.dto.PatientResponseDto;
import com.careflow.patient.entity.Patient;
import com.careflow.patient.exception.ResourceNotFoundException;
import com.careflow.patient.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Transactional
    public PatientResponseDto createPatient(PatientRequestDto dto) {
        if (patientRepository.existsByEmail(dto.email().trim().toLowerCase())) {
            throw new IllegalArgumentException("Patient with email already exists");
        }
        Patient patient = new Patient();
        applyDto(patient, dto);
        return toDto(patientRepository.save(patient));
    }

    @Transactional(readOnly = true)
    public PatientResponseDto getPatientById(Long id) {
        return patientRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public PatientResponseDto getPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for userId: " + userId));
    }

    @Transactional(readOnly = true)
    public Page<PatientResponseDto> getPatients(String query, Pageable pageable) {
        return patientRepository.searchActivePatients(query, pageable).map(this::toDto);
    }

    @Transactional
    public PatientResponseDto updatePatient(Long id, PatientRequestDto dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        applyDto(patient, dto);
        return toDto(patientRepository.save(patient));
    }

    @Transactional
    public void deletePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        patient.setActive(false);
        patientRepository.save(patient);
    }

    private void applyDto(Patient p, PatientRequestDto dto) {
        p.setUserId(dto.userId());
        p.setFirstName(dto.firstName().trim());
        p.setLastName(dto.lastName().trim());
        p.setDateOfBirth(dto.dateOfBirth());
        p.setGender(dto.gender());
        p.setPhone(dto.phone().trim());
        p.setEmail(dto.email().trim().toLowerCase());
        p.setAddress(dto.address());
        p.setBloodGroup(dto.bloodGroup());
        p.setEmergencyContact(dto.emergencyContact());
        p.setInsuranceProvider(dto.insuranceProvider());
    }

    private PatientResponseDto toDto(Patient p) {
        return new PatientResponseDto(
                p.getId(), p.getUserId(), p.getFirstName(), p.getLastName(),
                p.getDateOfBirth(), p.getGender(), p.getPhone(), p.getEmail(),
                p.getAddress(), p.getBloodGroup(), p.getEmergencyContact(),
                p.getInsuranceProvider(), p.isActive(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
