package com.careflow.patient.repository;

import com.careflow.patient.entity.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    Page<ServiceRequest> findByPatientId(Long patientId, Pageable pageable);
    Page<ServiceRequest> findByStatus(String status, Pageable pageable);
}
