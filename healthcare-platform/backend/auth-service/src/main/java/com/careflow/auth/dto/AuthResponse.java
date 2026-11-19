package com.careflow.auth.dto;

import java.util.List;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInMs,
        UserProfileResponse user
) {
    public record UserSummary(Long id, String email, String fullName, List<String> roles) {}
}
