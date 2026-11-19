package com.careflow.patient.repository;

import com.careflow.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUserId(Long userId);
    boolean existsByEmail(String email);

    @Query("""
            SELECT p FROM Patient p
            WHERE p.active = true
              AND (:query IS NULL OR :query = '' OR
                   LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR
                   LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR
                   LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Patient> searchActivePatients(@Param("query") String query, Pageable pageable);
}
