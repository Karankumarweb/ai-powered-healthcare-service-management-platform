package com.careflow.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AiChatRequest(
        @NotBlank(message = "Message is required")
        @Size(max = 1500, message = "Message cannot exceed 1500 characters")
        String message,
        boolean consentToProcess,
        List<ChatTurn> history
) {
    public record ChatTurn(String role, String content) {}
}
