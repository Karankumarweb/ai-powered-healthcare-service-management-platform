package com.careflow.doctor.controller;

import com.careflow.doctor.dto.*;
import com.careflow.doctor.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DoctorResponseDto> register(@Valid @RequestBody DoctorRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.registerDoctor(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponseDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping
    public ResponseEntity<Page<DoctorResponseDto>> getAll(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(doctorService.getDoctors(
                specialization, query, PageRequest.of(page, size, Sort.by("lastName").ascending())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DoctorResponseDto> update(@PathVariable Long id,
                                                      @Valid @RequestBody DoctorRequestDto dto) {
        return ResponseEntity.ok(doctorService.updateDoctor(id, dto));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<AvailabilityResponseDto>> getAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getAvailability(id));
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<AvailabilityResponseDto>> updateAvailability(
            @PathVariable Long id,
            @Valid @RequestBody List<AvailabilityRequestDto> slots) {
        return ResponseEntity.ok(doctorService.updateAvailability(id, slots));
    }
}
