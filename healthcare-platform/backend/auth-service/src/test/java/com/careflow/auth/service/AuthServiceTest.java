package com.careflow.auth.service;

import com.careflow.auth.dto.AuthResponse;
import com.careflow.auth.dto.LoginRequest;
import com.careflow.auth.dto.RegisterRequest;
import com.careflow.auth.entity.Role;
import com.careflow.auth.entity.RoleName;
import com.careflow.auth.entity.User;
import com.careflow.auth.exception.AuthException;
import com.careflow.auth.repository.RefreshTokenRepository;
import com.careflow.auth.repository.RoleRepository;
import com.careflow.auth.repository.UserRepository;
import com.careflow.auth.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    @Test
    void registerCreatesPatientAccountAndReturnsTokens() {
        RegisterRequest req = new RegisterRequest("Liam Miller", "liam@careflow.test", "StrongPass123!", "PATIENT");
        Role patientRole = new Role(RoleName.ROLE_PATIENT, "Patient");

        when(userRepository.existsByEmail("liam@careflow.test")).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_PATIENT)).thenReturn(Optional.of(patientRole));
        when(passwordEncoder.encode("StrongPass123!")).thenReturn("$2a$10$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("mock-jwt-token");
        when(jwtService.getAccessExpirationMs()).thenReturn(900000L);

        AuthResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.accessToken());
        assertEquals("liam@careflow.test", response.user().email());
        verify(refreshTokenRepository).save(any());
    }

    @Test
    void registerThrowsConflictWhenEmailExists() {
        RegisterRequest req = new RegisterRequest("Liam Miller", "dup@careflow.test", "StrongPass123!", "PATIENT");
        when(userRepository.existsByEmail("dup@careflow.test")).thenReturn(true);

        assertThrows(AuthException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginRevokesPreviousTokensAndIssuesNewPair() {
        User user = new User();
        user.setId(5L);
        user.setEmail("sofia@careflow.test");
        user.setFullName("Sofia Garcia");
        user.setRoles(Set.of(new Role(RoleName.ROLE_PATIENT, "Patient")));

        when(userRepository.findByEmail("sofia@careflow.test")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("new-jwt-token");

        AuthResponse res = authService.login(new LoginRequest("sofia@careflow.test", "Password123!"));

        assertEquals("new-jwt-token", res.accessToken());
        verify(refreshTokenRepository).revokeAllByUser(user);
        verify(refreshTokenRepository).save(any());
    }
}
