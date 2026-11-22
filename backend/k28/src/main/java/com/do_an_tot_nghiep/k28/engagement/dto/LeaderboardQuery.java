package com.do_an_tot_nghiep.k28.engagement.dto;

import jakarta.validation.constraints.AssertTrue;

public record LeaderboardQuery(
        KyXepHang ky,
        Integer gioiHan
) {

    public LeaderboardQuery {
        ky = ky == null ? KyXepHang.TUAN : ky;
        gioiHan = gioiHan == null ? 10 : gioiHan;
    }

    @AssertTrue(message = "Chỉ xem được top 10, 50 hoặc 100")
    public boolean isGioiHanHopLe() {
        return gioiHan == 10 || gioiHan == 50 || gioiHan == 100;
    }
}
