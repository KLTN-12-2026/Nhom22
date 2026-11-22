package com.do_an_tot_nghiep.k28.common.realtime;

import com.do_an_tot_nghiep.k28.common.realtime.SuKienRealtime.PhamVi;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RealtimeService {

    private final ApplicationEventPublisher events;

    public void toUser(Long nguoiDungId, LoaiSuKien loai, Object id) {
        events.publishEvent(new SuKienRealtime(nguoiDungId, PhamVi.NGUOI_DUNG, loai, id == null ? null : id.toString()));
    }

    public void toAdmins(LoaiSuKien loai) {
        events.publishEvent(new SuKienRealtime(null, PhamVi.QUAN_TRI, loai, null));
    }

    public void toAdmins(LoaiSuKien loai, Object id) {
        events.publishEvent(new SuKienRealtime(null, PhamVi.QUAN_TRI, loai, id == null ? null : id.toString()));
    }

    public void toOtherAdmins(Long nguoiXuLyId, LoaiSuKien loai, Object id) {
        events.publishEvent(new SuKienRealtime(nguoiXuLyId, PhamVi.QUAN_TRI, loai, id == null ? null : id.toString()));
    }

    public void toEveryone(LoaiSuKien loai) {
        events.publishEvent(new SuKienRealtime(null, PhamVi.TAT_CA, loai, null));
    }
}
