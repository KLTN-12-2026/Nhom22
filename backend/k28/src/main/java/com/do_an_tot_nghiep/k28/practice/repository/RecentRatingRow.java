package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.time.Instant;

public record RecentRatingRow(Long theId, DanhGia danhGia, Instant createdAt) {
}
