package com.do_an_tot_nghiep.k28.stats.repository;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.time.Instant;

public record ReviewStatRow(Instant createdAt, Long theId, DanhGia danhGia) {
}
