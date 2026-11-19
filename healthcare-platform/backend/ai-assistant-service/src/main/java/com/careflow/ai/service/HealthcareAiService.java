package com.careflow.ai.service;

import com.careflow.ai.dto.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class HealthcareAiService {

    public static final String MEDICAL_DISCLAIMER =
            "Informational guidance only: This assistant does not diagnose conditions, prescribe medications, " +
            "or replace licensed medical professionals. For emergencies, call your local emergency number immediately.";

    private static final String SYSTEM_PROMPT = """
            You are CareFlow's Healthcare Service Navigation Assistant.
            Your role is strictly administrative and informational:
            1. Help patients understand how to book, reschedule, or cancel appointments.
            2. Explain what documents to bring (photo ID, insurance card, prior records, medication list).
            3. Guide users on submitting Healthcare Service Requests and contacting clinic departments.
            4. NEVER diagnose diseases, interpret lab results clinically, prescribe or adjust medications, or give emergency medical instructions.
            If a user describes urgent symptoms (chest pain, difficulty breathing, severe bleeding), advise them to seek immediate emergency medical care.
            Keep answers calm, structured, concise, and under 180 words.
            """;

    private final ChatClient chatClient;
    private final PiiSanitizer piiSanitizer;

    public HealthcareAiService(ChatClient.Builder chatClientBuilder, PiiSanitizer piiSanitizer) {
        this.chatClient = chatClientBuilder.build();
        this.piiSanitizer = piiSanitizer;
    }

    public AiChatResponse chat(AiChatRequest request) {
        if (!request.consentToProcess()) {
            throw new IllegalArgumentException("Explicit user consent is required before sending text to the AI assistant");
        }

        PiiSanitizer.SanitizeResult sanitized = piiSanitizer.sanitize(request.message());

        try {
            String answer = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(sanitized.text())
                    .call()
                    .content();

            return new AiChatResponse(
                    answer != null ? answer : "I could not generate a response right now. Please try again.",
                    MEDICAL_DISCLAIMER,
                    List.of("Open Appointment Booking", "View Doctor Directory", "Submit a Service Request"),
                    sanitized.redacted(),
                    Instant.now()
            );
        } catch (Exception ex) {
            return new AiChatResponse(
                    "The AI assistant is temporarily experiencing high demand or rate limits. " +
                    "You can still book appointments from the Appointment Booking page or submit a Service Request directly.",
                    MEDICAL_DISCLAIMER,
                    List.of("Go to Appointment Booking", "Submit a Service Request"),
                    sanitized.redacted(),
                    Instant.now()
            );
        }
    }

    public StructuredSummaryResponse summarizeServiceRequest(SummarizeRequestDto dto) {
        if (!dto.consentToProcess()) {
            throw new IllegalArgumentException("User consent is required to summarize a service request");
        }

        PiiSanitizer.SanitizeResult cleanSubject = piiSanitizer.sanitize(dto.subject());
        PiiSanitizer.SanitizeResult cleanDesc = piiSanitizer.sanitize(dto.description());

        String prompt = String.format(
                "Summarize this administrative healthcare service request cleanly in 1-2 sentences without inventing medical claims. " +
                "Category: %s. Subject: %s. Description: %s",
                dto.category(), cleanSubject.text(), cleanDesc.text()
        );

        try {
            StructuredSummaryResponse result = chatClient.prompt()
                    .system("You summarize administrative clinic requests into structured JSON. Never include diagnosis or prescriptions.")
                    .user(prompt)
                    .call()
                    .entity(StructuredSummaryResponse.class);

            if (result != null) {
                return new StructuredSummaryResponse(
                        result.conciseSummary(),
                        result.recommendedDepartment(),
                        result.urgencyLevel(),
                        result.actionItems(),
                        MEDICAL_DISCLAIMER
                );
            }
        } catch (Exception ignored) {
            // Fall through to safe deterministic summary on upstream AI rate-limit/timeout
        }

        return new StructuredSummaryResponse(
                "Administrative request under " + dto.category() + ": " + cleanSubject.text(),
                "Patient Services Desk",
                "MEDIUM",
                List.of("Review patient request details", "Assign to clinic coordinator", "Update ticket status"),
                MEDICAL_DISCLAIMER
        );
    }
}
