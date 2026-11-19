package com.careflow.ai.service;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class PiiSanitizer {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d{1,3}[-.\\s]?)?(\\(?\\d{3}\\)?[-.\\s]?)\\d{3}[-.\\s]?\\d{4}");
    private static final Pattern SSN_PATTERN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");

    public SanitizeResult sanitize(String rawText) {
        if (rawText == null) {
            return new SanitizeResult("", false);
        }
        String sanitized = EMAIL_PATTERN.matcher(rawText).replaceAll("[REDACTED_EMAIL]");
        sanitized = PHONE_PATTERN.matcher(sanitized).replaceAll("[REDACTED_PHONE]");
        sanitized = SSN_PATTERN.matcher(sanitized).replaceAll("[REDACTED_ID]");
        boolean changed = !sanitized.equals(rawText);
        return new SanitizeResult(sanitized, changed);
    }

    public record SanitizeResult(String text, boolean redacted) {}
}
