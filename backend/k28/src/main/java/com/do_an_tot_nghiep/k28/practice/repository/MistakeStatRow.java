package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
import java.time.Instant;

public record MistakeStatRow(Long theId, NhomLoi nhomLoi, Long soLan, Instant lanCuoiAt) {
}
