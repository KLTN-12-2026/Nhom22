package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguonBo;

import java.time.Instant;

public record LibraryDeckResponse(
        String id,
        String ten,
        String moTa,
        String chuDeId,
        String tenChuDe,
        TrinhDo trinhDo,
        MucTieu mucTieu,
        NguonBo nguon,
        String chuSoHuuId,
        String tenTacGia,
        long soThe,
        Instant createdAt,
        Instant updatedAt
) {
}