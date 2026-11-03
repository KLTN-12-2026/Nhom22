package com.do_an_tot_nghiep.k28.admin.dto;

final class Reasons {

    private Reasons() {
    }

    static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
