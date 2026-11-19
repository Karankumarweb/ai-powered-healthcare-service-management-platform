package com.careflow.doctor.repository;

import com.careflow.doctor.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctorId(Long doctorId);
    void deleteByDoctorId(Long doctorId);
}
