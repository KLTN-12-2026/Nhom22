package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiSuKien;
import java.time.Instant;
import java.time.LocalDate;

public record RewardEventResponse(
        String id,
        LoaiSuKien loaiSuKien,
        int diemGoc,
        int soDiem,
        LocalDate ngayDiaPhuong,
        Instant createdAt
) {
}
