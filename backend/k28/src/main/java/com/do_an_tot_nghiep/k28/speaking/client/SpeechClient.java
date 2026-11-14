package com.do_an_tot_nghiep.k28.speaking.client;

public interface SpeechClient {

    String nhaCungCap();

    SpeechResult danhGia(byte[] wav, String vanBanMau);
}
