package com.do_an_tot_nghiep.k28.speaking.client;

import lombok.Getter;

@Getter
public class TtsException extends RuntimeException {

    private final String maLoi;

    public TtsException(String maLoi) {
        super(maLoi);
        this.maLoi = maLoi;
    }
}
