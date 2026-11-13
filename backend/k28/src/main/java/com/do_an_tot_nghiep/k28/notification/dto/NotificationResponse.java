package com.do_an_tot_nghiep.k28.notification.dto;

import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import java.time.Instant;
import java.time.LocalDate;

public record NotificationResponse(
        String id,
        LoaiThongBao loai,
        String tieuDe,
        String noiDung,
        String lienKet,
        LocalDate ngayDiaPhuong,
        Instant daDocAt,
        Instant createdAt
) {
}
