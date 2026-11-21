package com.do_an_tot_nghiep.k28.engagement.dto;

import java.time.LocalDate;
import java.util.List;

public record LeaderboardResponse(
        KyXepHang ky,
        LocalDate tuNgay,
        LocalDate denNgay,
        int gioiHan,
        int luotToiThieu,
        long tongNguoi,
        boolean thamGia,
        List<LeaderboardEntryResponse> top,
        LeaderboardEntryResponse toi,
        LeaderboardEntryResponse truocToi
) {
}
