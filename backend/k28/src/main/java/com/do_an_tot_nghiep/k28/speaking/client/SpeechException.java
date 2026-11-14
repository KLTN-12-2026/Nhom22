package com.do_an_tot_nghiep.k28.speaking.client;

import lombok.Getter;

@Getter
public class SpeechException extends RuntimeException {

    private final String maLoi;

    public SpeechException(String maLoi) {
        super(maLoi);
        this.maLoi = maLoi;
    }
}
