package com.do_an_tot_nghiep.k28.practice.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

final class AnswerNormalizer {

    private static final Pattern NHAY = Pattern.compile("[\\u2018\\u2019\\u0060\\u00B4]");
    private static final Pattern GACH_NOI = Pattern.compile("[\\u2010\\u2011]");
    private static final Pattern KHOANG_TRANG = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);

    private AnswerNormalizer() {
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String text = Normalizer.normalize(value, Normalizer.Form.NFC);
        text = NHAY.matcher(text).replaceAll("'");
        text = GACH_NOI.matcher(text).replaceAll("-");
        return KHOANG_TRANG.matcher(text).replaceAll(" ").strip().toLowerCase(Locale.ROOT);
    }
}
