package com.do_an_tot_nghiep.k28.account.dto;

import java.time.LocalDate;

public record ThemeEventResponse(
        String id,
        String giaoDienMa,
        LocalDate ngayLe,
        int soNgayTruoc,
        int soNgaySau,
        LocalDate moTu,
        LocalDate denHet,
        boolean dangMo
) {
}
