package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import java.time.Instant;

public record DeckResponse(
        String id,
        String chuSoHuuId,
        String chuDeId,
        String ten,
        String moTa,
        TrinhDo trinhDo,
        MucTieu mucTieu,
        QuyenTruyCap quyenTruyCap,
        TrangThaiKiemDuyet trangThaiKiemDuyet,
        String boNguonId,
        boolean yeuThich,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}