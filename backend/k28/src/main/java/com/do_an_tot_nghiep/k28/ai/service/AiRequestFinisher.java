package com.do_an_tot_nghiep.k28.ai.service;

import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiHanMuc;
import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi;
import com.do_an_tot_nghiep.k28.ai.repository.YeuCauAiRepository;
import com.do_an_tot_nghiep.k28.common.job.KetQuaTacVu;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiRequestFinisher {

    private final YeuCauAiRepository requests;
    private final QuotaService quota;

    public void finish(Long yeuCauId, KetQuaTacVu ketQua) {
        requests.findForUpdate(yeuCauId).ifPresent(request -> {
            switch (ketQua.trangThai()) {
                case XONG -> {
                    request.ketThuc(TrangThaiYeuCauAi.HOAN_TAT, null);
                    if (request.chotHanMuc(TrangThaiHanMuc.DA_DUNG)) {
                        quota.xacNhan(request.getNguoiDungId(), request.giuCho());
                    }
                }
                case KHONG_XAC_DINH -> {
                    request.ketThuc(TrangThaiYeuCauAi.KHONG_XAC_DINH, ketQua.maLoi());
                    if (request.chotHanMuc(TrangThaiHanMuc.DA_DUNG)) {
                        quota.xacNhan(request.getNguoiDungId(), request.giuCho());
                    }
                }
                case LOI -> {
                    request.ketThuc(TrangThaiYeuCauAi.LOI, ketQua.maLoi());
                    if (request.chotHanMuc(TrangThaiHanMuc.DA_HOAN)) {
                        quota.hoanTra(request.getNguoiDungId(), request.giuCho());
                    }
                }
                default -> {
                }
            }
        });
    }
}
