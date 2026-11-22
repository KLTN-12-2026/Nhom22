package com.do_an_tot_nghiep.k28.common.realtime;

public record SuKienRealtime(Long nguoiDungId, PhamVi phamVi, LoaiSuKien loai, String id) {

    public enum PhamVi {
        NGUOI_DUNG,
        QUAN_TRI,
        TAT_CA
    }
}
