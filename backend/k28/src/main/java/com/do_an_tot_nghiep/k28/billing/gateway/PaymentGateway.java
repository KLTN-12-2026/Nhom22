package com.do_an_tot_nghiep.k28.billing.gateway;

import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import java.time.Instant;
import java.util.Map;

public interface PaymentGateway {

    CongThanhToan cong();

    String taoUrl(GiaoDichThanhToan giaoDich, String ipKhach, Instant hetHanAt);

    KetQuaCong xacMinh(Map<String, String> thamSo);
}
