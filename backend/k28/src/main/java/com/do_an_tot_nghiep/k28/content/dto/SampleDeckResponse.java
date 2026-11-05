package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import java.time.Instant;

public record SampleDeckResponse(
        String id,
        String ten,
        String moTa,
        MucTieu mucTieu,
        String chuDeId,
        String chuDeTen,
        TrinhDo trinhDo,
        QuyenTruyCap quyenTruyCap,
        TrangThaiKiemDuyet trangThaiKiemDuyet,
        int soThe,
        int soBanSao,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}
