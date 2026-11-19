package com.careflow.appointment.repository;

import com.careflow.appointment.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);
    Page<Appointment> findByDoctorId(Long doctorId, Pageable pageable);
    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusIn(Long doctorId, LocalDate date, List<String> statuses);

    @Query("""
            SELECT COUNT(a) > 0 FROM Appointment a
            WHERE a.doctorId = :doctorId
              AND a.appointmentDate = :date
              AND a.status IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULED')
              AND (:excludeId IS NULL OR a.id <> :excludeId)
              AND a.startTime < :endTime
              AND a.endTime > :startTime
            """)
    boolean existsOverlappingAppointment(@Param("doctorId") Long doctorId,
                                         @Param("date") LocalDate date,
                                         @Param("startTime") LocalTime startTime,
                                         @Param("endTime") LocalTime endTime,
                                         @Param("excludeId") Long excludeId);
}
