package com.careflow.patient.service;

import com.careflow.patient.dto.ServiceRequestCreateDto;
import com.careflow.patient.dto.ServiceRequestResponseDto;
import com.careflow.patient.entity.Patient;
import com.careflow.patient.entity.ServiceRequest;
import com.careflow.patient.exception.ResourceNotFoundException;
import com.careflow.patient.repository.PatientRepository;
import com.careflow.patient.repository.ServiceRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final PatientRepository patientRepository;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 PatientRepository patientRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.patientRepository = patientRepository;
    }

    @Transactional
    public ServiceRequestResponseDto create(ServiceRequestCreateDto dto) {
        Patient patient = patientRepository.findById(dto.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.patientId()));

        ServiceRequest sr = new ServiceRequest();
        sr.setPatient(patient);
        sr.setCategory(dto.category().trim());
        sr.setSubject(dto.subject().trim());
        sr.setDescription(dto.description().trim());
        sr.setAiSummary(dto.aiSummary());
        sr.setPriority(dto.priority() != null ? dto.priority() : "MEDIUM");
        sr.setStatus("OPEN");

        return toDto(serviceRequestRepository.save(sr));
    }

    @Transactional(readOnly = true)
    public Page<ServiceRequestResponseDto> getAll(Pageable pageable) {
        return serviceRequestRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ServiceRequestResponseDto> getByPatient(Long patientId, Pageable pageable) {
        return serviceRequestRepository.findByPatientId(patientId, pageable).map(this::toDto);
    }

    @Transactional
    public ServiceRequestResponseDto updateStatus(Long id, String status, String aiSummary) {
        ServiceRequest sr = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found: " + id));
        if (status != null) {
            sr.setStatus(status);
        }
        if (aiSummary != null) {
            sr.setAiSummary(aiSummary);
        }
        return toDto(serviceRequestRepository.save(sr));
    }

    private ServiceRequestResponseDto toDto(ServiceRequest sr) {
        return new ServiceRequestResponseDto(
                sr.getId(),
                sr.getPatient().getId(),
                sr.getPatient().getFirstName() + " " + sr.getPatient().getLastName(),
                sr.getCategory(),
                sr.getSubject(),
                sr.getDescription(),
                sr.getAiSummary(),
                sr.getPriority(),
                sr.getStatus(),
                sr.getAssignedTo(),
                sr.getCreatedAt(),
                sr.getUpdatedAt()
        );
    }
}
