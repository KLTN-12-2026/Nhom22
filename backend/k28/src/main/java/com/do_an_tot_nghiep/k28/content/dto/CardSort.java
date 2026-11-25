package com.do_an_tot_nghiep.k28.content.dto;

import org.springframework.data.domain.Sort;

public enum CardSort {
    MOI_NHAT(Sort.by(Sort.Direction.DESC, "id")),
    CU_NHAT(Sort.by(Sort.Direction.ASC, "id")),
    TU_AZ(Sort.by(Sort.Direction.ASC, "tu").and(Sort.by(Sort.Direction.DESC, "id"))),
    TU_ZA(Sort.by(Sort.Direction.DESC, "tu").and(Sort.by(Sort.Direction.DESC, "id")));

    private final Sort sort;

    CardSort(Sort sort) {
        this.sort = sort;
    }

    public Sort sort() {
        return sort;
    }

    public static CardSort orDefault(CardSort value) {
        return value == null ? MOI_NHAT : value;
    }

    public static String likePattern(String q) {
        String text = q == null ? "" : q.strip();
        return "%" + text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    public static boolean filtered(String q, CardSort sort) {
        return (q != null && !q.isBlank()) || orDefault(sort) != MOI_NHAT;
    }
}
