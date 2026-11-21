package com.do_an_tot_nghiep.k28.dictionary.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class DictionaryText {

    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    private DictionaryText() {
    }

    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String plain = Normalizer.normalize(text, Normalizer.Form.NFD);
        plain = MARKS.matcher(plain).replaceAll("")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
        return SPACES.matcher(plain).replaceAll(" ").strip();
    }

    public static String likePrefix(String normalized) {
        return normalized
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_") + "%";
    }
}
