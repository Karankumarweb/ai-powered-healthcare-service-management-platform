package com.careflow.ai.controller;

import com.careflow.ai.dto.*;
import com.careflow.ai.service.HealthcareAiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
public class AiAssistantController {

    private final HealthcareAiService healthcareAiService;

    public AiAssistantController(HealthcareAiService healthcareAiService) {
        this.healthcareAiService = healthcareAiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        return ResponseEntity.ok(healthcareAiService.chat(request));
    }

    @PostMapping("/summarize-request")
    public ResponseEntity<StructuredSummaryResponse> summarize(@Valid @RequestBody SummarizeRequestDto request) {
        return ResponseEntity.ok(healthcareAiService.summarizeServiceRequest(request));
    }
}
