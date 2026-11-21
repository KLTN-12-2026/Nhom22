package com.do_an_tot_nghiep.k28.notification.dto;

import com.do_an_tot_nghiep.k28.notification.entity.enums.MucDoThongBao;
import java.time.Instant;

public record AnnouncementResponse(
        String id,
        String tieuDe,
        String noiDung,
        MucDoThongBao mucDo,
        String lienKet,
        Instant batDauAt,
        Instant ketThucAt
) {
}
