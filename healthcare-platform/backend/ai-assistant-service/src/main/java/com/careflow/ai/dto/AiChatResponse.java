package com.careflow.ai.dto;

import java.time.Instant;
import java.util.List;

public record AiChatResponse(
        String reply,
        String disclaimer,
        List<String> suggestedNextSteps,
        boolean piiRedacted,
        Instant timestamp
) {}
