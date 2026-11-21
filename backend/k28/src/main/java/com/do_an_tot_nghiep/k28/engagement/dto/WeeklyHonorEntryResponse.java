package com.do_an_tot_nghiep.k28.engagement.dto;

public record WeeklyHonorEntryResponse(
        int hang,
        String nguoiDungId,
        String tenHienThi,
        String anhDaiDienUrl,
        String goiMa,
        int soNgay,
        long soLuotHopLe,
        int soLanTop3
) {
}
