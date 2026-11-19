package com.careflow.auth.dto;

import java.time.Instant;
import java.util.List;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        List<String> roles,
        boolean enabled,
        Instant createdAt
) {}
