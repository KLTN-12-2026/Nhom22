package com.do_an_tot_nghiep.k28.notification.service;

import com.do_an_tot_nghiep.k28.account.dto.ReminderTarget;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.learning.service.DailyUsageService;
import com.do_an_tot_nghiep.k28.learning.service.StreakService;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationListResponse;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationQuery;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationResponse;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationUpdateRequest;
import com.do_an_tot_nghiep.k28.notification.entity.ThongBao;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.mapper.NotificationMapper;
import com.do_an_tot_nghiep.k28.notification.repository.ThongBaoRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

@Service
@RequiredArgsConstructor
public class NotificationService {

    static final String REMINDER_LINK = "/hom-nay";
    static final String SETTINGS_LINK = "/ca-nhan/thong-bao";

    private final Clock clock;
    private final ThongBaoRepository notifications;
    private final NotificationMapper mapper;
    private final DailyUsageService dailyUsage;
    private final MailService mail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional(readOnly = true)
    public NotificationListResponse list(Long userId, NotificationQuery query) {
        return new NotificationListResponse(
                notifications.countByNguoiDungIdAndHienThiTrueAndDaDocAtIsNull(userId),
                PageResponse.of(notifications
                        .inbox(userId, query.chuaDoc(), PageRequest.of(query.page(), query.size()))
                        .map(mapper::toResponse)));
    }

    @Transactional
    public NotificationResponse update(Long userId, Long id, NotificationUpdateRequest request) {
        ThongBao thongBao = notifications.findByIdAndNguoiDungIdAndHienThiTrue(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy thông báo"));
        thongBao.markRead(request.daDoc(), clock.instant());
        return mapper.toResponse(notifications.saveAndFlush(thongBao));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public boolean create(
            Long userId,
            LoaiThongBao loai,
            LocalDate ngay,
            String tieuDe,
            String noiDung,
            String lienKet,
            boolean hienThi,
            boolean guiEmail
    ) {
        return notifications.insertOnce(userId, loai.name(), ngay, tieuDe, noiDung, lienKet,
                hienThi, guiEmail, clock.instant()) == 1;
    }

    @Transactional
    public boolean remind(ReminderTarget target, Instant now) {
        ZonedDateTime local = now.atZone(ZoneId.of(target.muiGio()));
        if (local.toLocalTime().isBefore(target.gioNhac())) {
            return false;
        }
        LocalDate ngay = local.toLocalDate();
        int soLuot = dailyUsage.validReviews(target.id(), ngay);
        if (soLuot >= StreakService.LUOT_TOI_THIEU_CHUOI) {
            return false;
        }
        String tieuDe = "Đến giờ ôn từ vựng";
        String noiDung = "Hôm nay bạn đã ôn " + soLuot + "/" + StreakService.LUOT_TOI_THIEU_CHUOI
                + " lượt. Ôn thêm vài thẻ để giữ chuỗi ngày học.";
        boolean created = create(target.id(), LoaiThongBao.NHAC_HOC, ngay, tieuDe, noiDung, REMINDER_LINK,
                target.nhanTrongUngDung(), target.nhanEmail());
        if (created && target.nhanEmail()) {
            mail.send(target.email(), tieuDe, reminderHtml(target.tenHienThi(), noiDung));
        }
        return created;
    }

    private String reminderHtml(String tenHienThi, String noiDung) {
        return "<p>Chào " + HtmlUtils.htmlEscape(tenHienThi) + ",</p>"
                + "<p>" + HtmlUtils.htmlEscape(noiDung) + "</p>"
                + "<p><a href=\"" + frontendUrl + REMINDER_LINK + "\">Vào học ngay</a></p>"
                + "<p style=\"font-size:12px;color:#666\">Không muốn nhận email nhắc học? "
                + "<a href=\"" + frontendUrl + SETTINGS_LINK + "\">Tắt trong cài đặt thông báo</a>.</p>";
    }
}
