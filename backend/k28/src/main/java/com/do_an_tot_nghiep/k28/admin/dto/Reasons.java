package com.do_an_tot_nghiep.k28.admin.dto;

public final class Reasons {

    private Reasons() {
    }

    public static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
