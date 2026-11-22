package com.do_an_tot_nghiep.k28.content.dto;

import java.util.List;

public record CopyDiffResponse(
        boolean coThayDoi,
        int soTheGoc,
        int soTheBanSao,
        int soThem,
        int soXoa,
        int soSua,
        List<FieldChange> boThe,
        List<CardChange> the
) {

    public record FieldChange(String truong, String truoc, String sau) {
    }

    public record CardChange(String loai, String theId, String tu, String tuGoc, List<FieldChange> truong) {
    }
}
