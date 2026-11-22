package com.do_an_tot_nghiep.k28.billing.dto;

public record PlanResponse(
        String ma,
        String ten,
        long giaThang,
        long giaNam,
        Integer gioiHanThe,
        boolean phatAm,
        boolean boMauCaoCap,
        Integer hanMucAi,
        Integer hanMucAnh,
        Integer hanMucPhatAm,
        Integer hanMucTts
) {
}
