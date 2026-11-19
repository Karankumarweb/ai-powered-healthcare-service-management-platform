package com.careflow.doctor.repository;

import com.careflow.doctor.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    boolean existsByEmailOrLicenseNumber(String email, String licenseNumber);

    @Query("""
            SELECT d FROM Doctor d
            WHERE (:specialization IS NULL OR :specialization = '' OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%')))
              AND (:query IS NULL OR :query = '' OR
                   LOWER(d.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR
                   LOWER(d.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR
                   LOWER(d.department) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Doctor> searchDoctors(@Param("specialization") String specialization,
                               @Param("query") String query,
                               Pageable pageable);
}
