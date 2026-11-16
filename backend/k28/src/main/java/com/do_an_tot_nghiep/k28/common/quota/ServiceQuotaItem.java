package com.do_an_tot_nghiep.k28.common.quota;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;

public record ServiceQuotaItem(String id, String goiMa, LoaiDichVu loai, int soLuotNgay, Long version) {
}
