package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.NhomGiaoDien;

public record ThemeResponse(
        String ma,
        String ten,
        String moTa,
        NhomGiaoDien nhom,
        String goiToiThieu,
        boolean coAmThanh,
        boolean duocDung,
        String lyDoKhoa,
        ThemeEventResponse leHoi
) {
}
