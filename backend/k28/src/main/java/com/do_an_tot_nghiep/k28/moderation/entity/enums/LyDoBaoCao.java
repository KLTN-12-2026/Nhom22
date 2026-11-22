package com.do_an_tot_nghiep.k28.moderation.entity.enums;

import java.util.EnumSet;
import java.util.Set;

public enum LyDoBaoCao {
    SAI_NOI_DUNG,
    SAI_CHINH_TA,
    KHONG_PHU_HOP,
    SPAM,
    BAN_QUYEN,
    KHAC,
    ANH_DAI_DIEN_NHAY_CAM,
    TEN_KHONG_PHU_HOP,
    MAO_DANH,
    QUAY_ROI;

    private static final Set<LyDoBaoCao> NGUOI_DUNG = EnumSet.of(
            ANH_DAI_DIEN_NHAY_CAM, TEN_KHONG_PHU_HOP, SPAM, MAO_DANH, QUAY_ROI, KHAC);
    private static final Set<LyDoBaoCao> NOI_DUNG = EnumSet.of(
            SAI_NOI_DUNG, SAI_CHINH_TA, KHONG_PHU_HOP, SPAM, BAN_QUYEN, KHAC);

    public boolean appliesTo(LoaiDoiTuongBaoCao loai) {
        return loai == LoaiDoiTuongBaoCao.NGUOI_DUNG ? NGUOI_DUNG.contains(this) : NOI_DUNG.contains(this);
    }
}
