package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.content.dto.PublicBadgeResponse;
import java.time.Instant;
import java.util.List;

public record LeaderboardProfileResponse(
        String id,
        String tenHienThi,
        String anhDaiDienUrl,
        String goiMa,
        Instant thamGiaAt,
        int chuoiNgay,
        long soNgayHoc,
        long soLuotOn,
        long soBaiLuyen,
        long soBoThe,
        long soBoCongKhai,
        long soThe,
        long soLanTop3,
        List<PublicBadgeResponse> huyHieu
) {
}
