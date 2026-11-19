package com.careflow.ai.dto;

import java.util.List;

public record StructuredSummaryResponse(
        String conciseSummary,
        String recommendedDepartment,
        String urgencyLevel,
        List<String> actionItems,
        String disclaimer
) {}
