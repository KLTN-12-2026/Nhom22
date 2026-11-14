package com.do_an_tot_nghiep.k28.speaking.dto;

import java.time.Instant;

public record SoSanhPhatAm(
        String lanTruocId,
        Instant lanTruocAt,
        boolean cungThangDo,
        Double tongDiem,
        Double doChinhXac,
        Double doTroiChay,
        Double doDayDu
) {
}
