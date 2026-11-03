package com.do_an_tot_nghiep.k28.stats.repository;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;

public record SkillCountRow(LoaiCau loaiCau, boolean laLuyenLai, long soQuanSat, long soDung) {
}
