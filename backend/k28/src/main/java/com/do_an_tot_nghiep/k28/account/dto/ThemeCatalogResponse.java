package com.do_an_tot_nghiep.k28.account.dto;

import java.util.List;

public record ThemeCatalogResponse(
        String giaoDienMa,
        String goiMa,
        List<ThemeResponse> danhSach
) {
}
