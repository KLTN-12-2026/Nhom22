package com.do_an_tot_nghiep.k28.content.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class CardText {

    private static final Pattern WHITESPACE = Pattern.compile(
            "\\s+",
            Pattern.UNICODE_CHARACTER_CLASS
    );

    private CardText() {
    }

    public static String text(String value) {
        if (value == null) {
            return null;
        }

        return Normalizer.normalize(
                value, Normalizer.Form.NFC
        ).strip();
    }

    public static String term(String value) {
        String normalized = text(value);
        if (normalized == null) {
            return null;
        }

        return WHITESPACE.matcher(normalized)
                .replaceAll(" ")
                .strip();
    }

    public static String nullable(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    public static DuplicateKey duplicateKey(
            String tu,
            String tuLoai
    ) {
        return new DuplicateKey(
                comparisonValue(tu),
                comparisonValue(tuLoai)
        );
    }

    private static String comparisonValue(String value) {
        String normalized = term(value);
        return normalized == null
                ? ""
                : normalized.toLowerCase(Locale.ROOT);
    }

    public record DuplicateKey(String tu, String tuLoai) {
    }
}