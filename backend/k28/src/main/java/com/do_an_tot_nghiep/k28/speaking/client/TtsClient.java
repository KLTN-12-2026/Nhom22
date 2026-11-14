package com.do_an_tot_nghiep.k28.speaking.client;

public interface TtsClient {

    String nhaCungCap();

    String model();

    String giong();

    TtsResult docVanBan(String vanBan);
}
