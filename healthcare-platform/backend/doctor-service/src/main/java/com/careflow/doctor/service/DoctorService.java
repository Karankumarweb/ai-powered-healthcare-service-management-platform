package com.careflow.doctor.service;

import com.careflow.doctor.dto.*;
import com.careflow.doctor.entity.Doctor;
import com.careflow.doctor.entity.DoctorAvailability;
import com.careflow.doctor.exception.ResourceNotFoundException;
import com.careflow.doctor.repository.DoctorAvailabilityRepository;
import com.careflow.doctor.repository.DoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;

    public DoctorService(DoctorRepository doctorRepository,
                         DoctorAvailabilityRepository availabilityRepository) {
        this.doctorRepository = doctorRepository;
        this.availabilityRepository = availabilityRepository;
    }

    @Transactional
    public DoctorResponseDto registerDoctor(DoctorRequestDto dto) {
        String email = dto.email().trim().toLowerCase();
        if (doctorRepository.existsByEmailOrLicenseNumber(email, dto.licenseNumber().trim())) {
            throw new IllegalArgumentException("Doctor with email or license number already exists");
        }
        Doctor doctor = new Doctor();
        applyDto(doctor, dto);
        return toDto(doctorRepository.save(doctor));
    }

    @Transactional(readOnly = true)
    public DoctorResponseDto getDoctorById(Long id) {
        return doctorRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Page<DoctorResponseDto> getDoctors(String specialization, String query, Pageable pageable) {
        return doctorRepository.searchDoctors(specialization, query, pageable).map(this::toDto);
    }

    @Transactional
    public DoctorResponseDto updateDoctor(Long id, DoctorRequestDto dto) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        applyDto(doctor, dto);
        return toDto(doctorRepository.save(doctor));
    }

    @Transactional
    public List<AvailabilityResponseDto> updateAvailability(Long doctorId, List<AvailabilityRequestDto> slots) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        availabilityRepository.deleteByDoctorId(doctorId);
        List<DoctorAvailability> entities = slots.stream().map(s -> {
            if (!s.endTime().isAfter(s.startTime())) {
                throw new IllegalArgumentException("End time must be after start time");
            }
            DoctorAvailability avail = new DoctorAvailability();
            avail.setDoctor(doctor);
            avail.setDayOfWeek(s.dayOfWeek());
            avail.setStartTime(s.startTime());
            avail.setEndTime(s.endTime());
            avail.setSlotDurationMinutes(s.slotDurationMinutes());
            avail.setAvailable(s.available());
            return avail;
        }).toList();

        return availabilityRepository.saveAll(entities).stream()
                .map(a -> new AvailabilityResponseDto(
                        a.getId(), a.getDayOfWeek(), a.getStartTime(), a.getEndTime(),
                        a.getSlotDurationMinutes(), a.isAvailable()
                )).toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponseDto> getAvailability(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }
        return availabilityRepository.findByDoctorId(doctorId).stream()
                .map(a -> new AvailabilityResponseDto(
                        a.getId(), a.getDayOfWeek(), a.getStartTime(), a.getEndTime(),
                        a.getSlotDurationMinutes(), a.isAvailable()
                )).toList();
    }

    private void applyDto(Doctor d, DoctorRequestDto dto) {
        d.setUserId(dto.userId());
        d.setFirstName(dto.firstName().trim());
        d.setLastName(dto.lastName().trim());
        d.setEmail(dto.email().trim().toLowerCase());
        d.setPhone(dto.phone().trim());
        d.setSpecialization(dto.specialization().trim());
        d.setLicenseNumber(dto.licenseNumber().trim());
        d.setYearsExperience(dto.yearsExperience());
        d.setConsultationFee(dto.consultationFee());
        d.setDepartment(dto.department().trim());
        d.setBio(dto.bio());
        if (dto.acceptingPatients() != null) {
            d.setAcceptingPatients(dto.acceptingPatients());
        }
    }

    private DoctorResponseDto toDto(Doctor d) {
        List<AvailabilityResponseDto> avail = availabilityRepository.findByDoctorId(d.getId()).stream()
                .map(a -> new AvailabilityResponseDto(
                        a.getId(), a.getDayOfWeek(), a.getStartTime(), a.getEndTime(),
                        a.getSlotDurationMinutes(), a.isAvailable()
                )).toList();
        return new DoctorResponseDto(
                d.getId(), d.getUserId(), d.getFirstName(), d.getLastName(),
                d.getEmail(), d.getPhone(), d.getSpecialization(), d.getLicenseNumber(),
                d.getYearsExperience(), d.getConsultationFee(), d.getDepartment(),
                d.getBio(), d.isAcceptingPatients(), avail
        );
    }
}
