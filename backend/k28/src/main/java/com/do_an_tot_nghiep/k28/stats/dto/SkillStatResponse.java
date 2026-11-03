package com.do_an_tot_nghiep.k28.stats.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.KyNang;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonSuKien;

public record SkillStatResponse(
        KyNang kyNang,
        int soQuanSat,
        int soLuotTinh,
        boolean duDuLieu,
        Integer mucLamChu,
        Integer tyLeDungLanDau,
        Integer tyLeDungSauLuyenLai,
        int soQuanSatToiThieu,
        NguonSuKien nguon
) {
}
