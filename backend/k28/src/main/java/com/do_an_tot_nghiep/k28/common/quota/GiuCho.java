package com.do_an_tot_nghiep.k28.common.quota;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import java.time.LocalDate;

public record GiuCho(LocalDate ngay, LoaiDichVu loai) {
}
