package com.do_an_tot_nghiep.k28.learning.dto;

import java.time.LocalDate;
import java.util.List;

public record KhoiPhucChuoiResponse(
        int toiDaThang,
        int daDungThang,
        int conLai,
        boolean coThe,
        boolean duLuot,
        int chuoiSauKhoiPhuc,
        List<LocalDate> ngayCanBu
) {
}
