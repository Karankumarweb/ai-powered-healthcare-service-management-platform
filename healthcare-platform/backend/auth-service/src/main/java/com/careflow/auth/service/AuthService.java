package com.careflow.auth.service;

import com.careflow.auth.dto.*;
import com.careflow.auth.entity.*;
import com.careflow.auth.exception.AuthException;
import com.careflow.auth.repository.RefreshTokenRepository;
import com.careflow.auth.repository.RoleRepository;
import com.careflow.auth.repository.UserRepository;
import com.careflow.auth.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException("An account with this email already exists", HttpStatus.CONFLICT);
        }

        RoleName targetRole = resolveSelfRegistrationRole(request.role());
        Role role = roleRepository.findByName(targetRole)
                .orElseGet(() -> roleRepository.save(new Role(targetRole, targetRole.name())));

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(role));
        user.setEnabled(true);

        User saved = userRepository.save(user);
        return issueTokenResponse(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));

        refreshTokenRepository.revokeAllByUser(user);
        return issueTokenResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken existing = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new AuthException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (existing.isRevoked() || existing.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthException("Refresh token expired or revoked", HttpStatus.UNAUTHORIZED);
        }

        existing.setRevoked(true);
        refreshTokenRepository.save(existing);

        return issueTokenResponse(existing.getUser());
    }

    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email)
                .ifPresent(refreshTokenRepository::revokeAllByUser);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));
        return toProfile(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));
        user.setFullName(request.fullName().trim());
        return toProfile(userRepository.save(user));
    }

    private AuthResponse issueTokenResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID() + "-" + UUID.randomUUID());
        refreshToken.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                "Bearer",
                jwtService.getAccessExpirationMs(),
                toProfile(user)
        );
    }

    private RoleName resolveSelfRegistrationRole(String requested) {
        if ("DOCTOR".equalsIgnoreCase(requested) || "ROLE_DOCTOR".equalsIgnoreCase(requested)) {
            return RoleName.ROLE_DOCTOR;
        }
        return RoleName.ROLE_PATIENT;
    }

    private UserProfileResponse toProfile(User user) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}
