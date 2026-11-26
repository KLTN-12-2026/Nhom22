package com.do_an_tot_nghiep.k28.billing.dto;

public record AdminPlanResponse(
        String ma,
        String ten,
        long giaThang,
        long giaNam,
        Integer gioiHanThe,
        boolean phatAm,
        boolean thongKeNangCao,
        boolean hoatDong,
        long soDangKyHieuLuc,
        Long version
) {
}
