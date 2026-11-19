package com.careflow.auth.controller;

import com.careflow.auth.dto.AuthResponse;
import com.careflow.auth.dto.RegisterRequest;
import com.careflow.auth.dto.UserProfileResponse;
import com.careflow.auth.security.JwtService;
import com.careflow.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AuthService authService;
    @MockitoBean private JwtService jwtService;

    @Test
    void registerReturnsCreatedWithJwtPayload() throws Exception {
        AuthResponse res = new AuthResponse(
                "jwt-123",
                "refresh-456",
                "Bearer",
                900000L,
                new UserProfileResponse(1L, "maya@careflow.test", "Maya Lin", List.of("ROLE_PATIENT"), true, Instant.now())
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Maya Lin", "maya@careflow.test", "SecurePass99!", "PATIENT")
                        )))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("jwt-123"))
                .andExpect(jsonPath("$.user.email").value("maya@careflow.test"));
    }

    @Test
    void registerRejectsInvalidEmailWith400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Maya Lin", "not-an-email", "SecurePass99!", "PATIENT")
                        )))
                .andExpect(status().isBadRequest());
    }
}
