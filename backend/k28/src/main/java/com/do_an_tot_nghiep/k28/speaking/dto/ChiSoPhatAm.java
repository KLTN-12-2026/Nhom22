package com.do_an_tot_nghiep.k28.speaking.dto;

import java.util.List;
import java.util.stream.Stream;

public record ChiSoPhatAm(
        Double tongDiem,
        Double doChinhXac,
        Double doTroiChay,
        Double doDayDu,
        String vanBanNhanDien,
        List<ChiSoTu> tu
) {

    public ChiSoPhatAm {
        tu = tu == null ? List.of() : List.copyOf(tu);
    }

    public static ChiSoPhatAm empty() {
        return new ChiSoPhatAm(null, null, null, null, null, List.of());
    }

    public boolean hasNoScore() {
        return Stream.of(tongDiem, doChinhXac, doTroiChay, doDayDu).allMatch(v -> v == null);
    }

    public boolean hasAllScores() {
        return Stream.of(tongDiem, doChinhXac, doTroiChay, doDayDu).noneMatch(v -> v == null);
    }
}
