package com.do_an_tot_nghiep.k28.privacy.service;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import com.do_an_tot_nghiep.k28.common.job.JobHandler;
import com.do_an_tot_nghiep.k28.common.job.KetQuaTacVu;
import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.job.entity.enums.TrangThaiTacVu;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.privacy.entity.YeuCauXoaDuLieu;
import com.do_an_tot_nghiep.k28.privacy.repository.YeuCauXoaDuLieuRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class AccountDeletionJobHandler implements JobHandler {

    public static final String LOAI = "XOA_TAI_KHOAN";

    private final YeuCauXoaDuLieuRepository requests;
    private final AccountDataEraser eraser;
    private final AuditService audit;
    private final MailService mail;
    private final TransactionTemplate tx;
    private final JsonMapper json;
    private final Clock clock;

    @Override
    public String loai() {
        return LOAI;
    }

    @Override
    public void xuLy(TacVuNen job) {
        AccountDeletionPayload payload = payload(job);
        try {
            tx.executeWithoutResult(status -> {
                YeuCauXoaDuLieu yeuCau = requests.findForUpdate(payload.yeuCauId())
                        .orElseThrow(() -> new JobException(Kieu.LOI, "KHONG_TIM_THAY"));
                if (yeuCau.daKetThuc()) {
                    return;
                }
                yeuCau.batDau();
                Instant now = clock.instant();
                Map<String, Object> ketQua = eraser.erase(payload.nguoiDungId(), now);
                yeuCau.hoanTat(json.writeValueAsString(ketQua), now);
                audit.record(payload.nguoiDungId(), HanhDongQuanTri.XOA_TAI_KHOAN, LoaiDoiTuong.NGUOI_DUNG,
                        payload.nguoiDungId(), AccountDataEraser.TEN_AN_DANH, null, null, ketQua);
                mail.send(payload.email(), "Tài khoản VocabLearning đã được xóa",
                        "<p>Chào " + HtmlUtils.htmlEscape(payload.tenHienThi()) + ",</p>"
                                + "<p>Chúng tôi đã xóa tài khoản và dữ liệu học tập riêng của bạn theo yêu cầu. "
                                + "Bộ thẻ bạn đã chia sẻ công khai được giữ lại và hiển thị tác giả là \""
                                + AccountDataEraser.TEN_AN_DANH + "\". Lịch sử giao dịch thanh toán được lưu để đối soát, "
                                + "không còn gắn với email của bạn.</p>"
                                + "<p>Bạn có thể đăng ký lại bằng email này bất cứ lúc nào.</p>");
            });
        } catch (DataAccessException e) {
            throw new JobException(Kieu.THU_LAI, "CSDL");
        }
    }

    @Override
    public void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
        if (ketQua.trangThai() == TrangThaiTacVu.XONG) {
            return;
        }
        tx.executeWithoutResult(status -> requests.findForUpdate(payload(job).yeuCauId())
                .filter(yeuCau -> !yeuCau.daKetThuc())
                .ifPresent(yeuCau -> yeuCau.loi(ketQua.maLoi() == null ? "LOI" : ketQua.maLoi())));
    }

    private AccountDeletionPayload payload(TacVuNen job) {
        return json.readValue(job.getPayloadJson(), AccountDeletionPayload.class);
    }
}
