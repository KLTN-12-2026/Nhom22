package com.do_an_tot_nghiep.k28.common.job;

import lombok.Getter;

@Getter
public class JobException extends RuntimeException{

    public enum Kieu {
        THU_LAI, LOI, KHONG_XAC_DINH
    }

    private final Kieu kieu;
    private final String maLoi;

    public JobException(Kieu kieu, String maLoi) {
        super(maLoi);
        this.kieu = kieu;
        this.maLoi = maLoi;
    }
}
