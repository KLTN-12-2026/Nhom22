package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.account.dto.NotificationContact;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.dto.ExpiryCheckResponse;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
import com.do_an_tot_nghiep.k28.billing.repository.DangKyGoiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionExpiryService {

    static final int NGAY_NHAC_TRUOC = 7;
    static final LocalTime GIO_NHAC = LocalTime.of(8, 0);
    static final String LINK_GIA_HAN = "/thanh-toan-goi";
    static final String LINK_HET_HAN = "/thanh-toan-goi?lyDo=HET_HAN";
    private static final Duration CUA_SO_QUET = Duration.ofDays(NGAY_NHAC_TRUOC + 2);
    private static final DateTimeFormatter GIO = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter GIO_NGAY = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final DangKyGoiRepository dangKyGoi;
    private final GiaoDichThanhToanRepository giaoDich;
    private final GoiDichVuRepository goiDichVu;
    private final AccountService accounts;
    private final NotificationService notifications;
    private final MailService mail;
    private final BillingProperties props;
    private final TransactionTemplate tx;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public ExpiryCheckResponse run(Instant now) {
        Integer donHetHan = tx.execute(status -> giaoDich.hetHanTatCaQuaHan(now.minus(props.orderTtl()), now));
        List<DangKyGoi> dangKy = dangKyGoi.findByTrangThaiAndHetHanAtBeforeOrderByIdAsc(
                TrangThaiDangKy.HIEU_LUC, now.plus(CUA_SO_QUET));
        Map<Long, NotificationContact> contacts = accounts.contacts(
                dangKy.stream().map(DangKyGoi::getNguoiDungId).distinct().toList());
        Map<String, String> tenGoi = goiDichVu.findAll().stream()
                .collect(Collectors.toMap(GoiDichVu::getMa, GoiDichVu::getTen));
        int nhac = 0;
        int hetHan = 0;
        for (DangKyGoi item : dangKy) {
            NotificationContact contact = contacts.get(item.getNguoiDungId());
            String ten = tenGoi.getOrDefault(item.getGoiMa(), item.getGoiMa());
            try {
                if (item.getHetHanAt().isAfter(now)) {
                    if (contact != null && remind(item, contact, ten, now)) {
                        nhac++;
                    }
                } else if (expire(item, contact, ten, now)) {
                    hetHan++;
                }
            } catch (DataAccessException | DateTimeException e) {
                log.warn("Subscription {} expiry check will be retried: {}", item.getId(), e.getMessage());
            }
        }
        return new ExpiryCheckResponse(nhac, hetHan, donHetHan == null ? 0 : donHetHan);
    }

    private boolean remind(DangKyGoi item, NotificationContact contact, String tenGoi, Instant now) {
        if (contact.trangThai() != TrangThaiNguoiDung.HOAT_DONG) {
            return false;
        }
        ZoneId zone = ZoneId.of(contact.muiGio());
        ZonedDateTime local = now.atZone(zone);
        if (local.toLocalTime().isBefore(GIO_NHAC)) {
            return false;
        }
        ZonedDateTime hetHan = item.getHetHanAt().atZone(zone);
        long soNgay = ChronoUnit.DAYS.between(local.toLocalDate(), hetHan.toLocalDate());
        if (soNgay < 0 || soNgay > NGAY_NHAC_TRUOC) {
            return false;
        }
        String noiDung = (soNgay == 0
                ? "Gói " + tenGoi + " hết hạn hôm nay lúc " + GIO.format(hetHan)
                : "Gói " + tenGoi + " còn " + soNgay + " ngày, hết hạn lúc " + GIO_NGAY.format(hetHan))
                + ". Gia hạn để việc học không bị gián đoạn.";
        return notify(contact, LoaiThongBao.GOI_SAP_HET_HAN, local.toLocalDate(), "Gói sắp hết hạn", noiDung,
                LINK_GIA_HAN, "Gia hạn gói");
    }

    private boolean expire(DangKyGoi item, NotificationContact contact, String tenGoi, Instant now) {
        Boolean changed = tx.execute(status -> {
            if (dangKyGoi.hetHanNeuDenHan(item.getId(), now) != 1) {
                return false;
            }
            if (contact != null && contact.trangThai() == TrangThaiNguoiDung.HOAT_DONG) {
                ZoneId zone = ZoneId.of(contact.muiGio());
                String noiDung = "Gói " + tenGoi + " đã hết hạn lúc " + GIO_NGAY.format(item.getHetHanAt().atZone(zone))
                        + ". Dữ liệu học của bạn vẫn được giữ nguyên, mua gói để học tiếp.";
                createAndMail(contact, LoaiThongBao.GOI_DA_HET_HAN, now.atZone(zone).toLocalDate(), "Gói đã hết hạn",
                        noiDung, LINK_HET_HAN, "Mua gói");
            }
            return true;
        });
        return Boolean.TRUE.equals(changed);
    }

    private boolean notify(NotificationContact contact, LoaiThongBao loai, LocalDate ngay, String tieuDe,
                           String noiDung, String lienKet, String nut) {
        return Boolean.TRUE.equals(tx.execute(status ->
                createAndMail(contact, loai, ngay, tieuDe, noiDung, lienKet, nut)));
    }

    private boolean createAndMail(NotificationContact contact, LoaiThongBao loai, LocalDate ngay, String tieuDe,
                                  String noiDung, String lienKet, String nut) {
        boolean email = contact.emailBat();
        boolean created = notifications.create(contact.id(), loai, ngay, tieuDe, noiDung, lienKet, true, email);
        if (created && email) {
            mail.send(contact.email(), tieuDe, "<p>Chào " + HtmlUtils.htmlEscape(contact.tenHienThi()) + ",</p>"
                    + "<p>" + HtmlUtils.htmlEscape(noiDung) + "</p>"
                    + "<p><a href=\"" + frontendUrl + lienKet + "\">" + nut + "</a></p>");
        }
        return created;
    }
}
