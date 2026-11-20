package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.entity.enums.NguoiDuyetCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import java.time.Instant;

public record DeckPublishStatusResponse(
        String id,
        NguoiDuyetCongKhai nguoiDuyet,
        TrangThaiYeuCauCongKhai trangThai,
        String loiNhan,
        String lyDo,
        Instant hetHanAt,
        Instant xuLyAt,
        Instant guiLaiSauAt,
        Instant createdAt,
        Long version
) {
}
