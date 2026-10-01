package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;

public record LearningSettingsResponse(
        TrinhDo trinhDo,
        MucTieu mucTieu,
        int phutMoiNgay,
        int tuMoiMoiNgay,
        boolean daHoanTatKhoiDau,
        Long version
) {
}
