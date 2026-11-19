package com.careflow.ai.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PiiSanitizerTest {

    private final PiiSanitizer sanitizer = new PiiSanitizer();

    @Test
    void redactsEmailPhoneAndSsnBeforeLlmCall() {
        String input = "Contact me at liam.miller@example.com or 555-234-5678, SSN 123-45-6789.";
        PiiSanitizer.SanitizeResult result = sanitizer.sanitize(input);

        assertTrue(result.redacted());
        assertFalse(result.text().contains("liam.miller@example.com"));
        assertFalse(result.text().contains("555-234-5678"));
        assertFalse(result.text().contains("123-45-6789"));
        assertTrue(result.text().contains("[REDACTED_EMAIL]"));
        assertTrue(result.text().contains("[REDACTED_PHONE]"));
        assertTrue(result.text().contains("[REDACTED_ID]"));
    }
}
