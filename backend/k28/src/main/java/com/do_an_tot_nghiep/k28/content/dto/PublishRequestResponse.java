package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.entity.enums.NguoiDuyetCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import java.time.Instant;

public record PublishRequestResponse(
        String id,
        String boTheId,
        String tenBoThe,
        String boNguonId,
        String tenBoNguon,
        String nguoiGuiId,
        String tenNguoiGui,
        NguoiDuyetCongKhai nguoiDuyet,
        TrangThaiYeuCauCongKhai trangThai,
        String loiNhan,
        String lyDo,
        Instant hetHanAt,
        Instant xuLyAt,
        Instant createdAt,
        Long version
) {
}
