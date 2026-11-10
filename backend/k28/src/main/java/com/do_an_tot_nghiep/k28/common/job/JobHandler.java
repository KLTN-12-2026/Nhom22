package com.do_an_tot_nghiep.k28.common.job;

import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;

public interface JobHandler {

    String loai();

    void xuLy(TacVuNen job);

    default void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
    }
}
