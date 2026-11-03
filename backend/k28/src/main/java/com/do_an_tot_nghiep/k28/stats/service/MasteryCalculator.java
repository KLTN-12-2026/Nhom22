package com.do_an_tot_nghiep.k28.stats.service;

import java.util.List;

public final class MasteryCalculator {

    private MasteryCalculator() {
    }

    public static Integer weighted(List<Boolean> newestFirst, int window) {
        long tongTrongSo = 0;
        long trongSoDung = 0;
        for (int i = 0; i < Math.min(newestFirst.size(), window); i++) {
            int trongSo = window - i;
            tongTrongSo += trongSo;
            if (newestFirst.get(i)) {
                trongSoDung += trongSo;
            }
        }
        return tongTrongSo == 0 ? null : percent(trongSoDung, tongTrongSo);
    }

    public static Integer percent(long dung, long tong) {
        return tong == 0 ? null : Math.toIntExact((200 * dung + tong) / (2 * tong));
    }
}
