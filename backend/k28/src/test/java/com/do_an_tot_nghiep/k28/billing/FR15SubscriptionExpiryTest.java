package com.do_an_tot_nghiep.k28.billing;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.billing.service.SubscriptionExpiryService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

class FR15SubscriptionExpiryTest extends AbstractIntegrationTest {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired SubscriptionExpiryService expiry;
    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;

    @Test
    void tc23_remindsOncePerDayFromSevenDaysAndExpiresOnce() {
        LocalDate today = LocalDate.now(VN);
        LocalDate d = today.plusDays(7);
        Instant hetHan = at(d, 12, 0);
        Long user = learner();
        Long dangKy = subscription(user, "PRO", hetHan);

        expiry.run(at(d.minusDays(8), 9, 0));
        expiry.run(at(d.minusDays(7), 7, 59));
        assertThat(notices(user, "GOI_SAP_HET_HAN")).isEmpty();

        expiry.run(at(d.minusDays(7), 8, 0));
        expiry.run(at(d.minusDays(7), 20, 0));
        assertThat(notices(user, "GOI_SAP_HET_HAN")).singleElement().asString()
                .contains("Gói Pro còn 7 ngày, hết hạn lúc 12:00 " + d.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        expiry.run(at(d.minusDays(3), 9, 0));
        expiry.run(at(d, 9, 0));
        expiry.run(at(d, 11, 59));
        List<String> sapHetHan = notices(user, "GOI_SAP_HET_HAN");
        assertThat(sapHetHan).hasSize(3);
        assertThat(sapHetHan.get(1)).contains("còn 3 ngày");
        assertThat(sapHetHan.get(2)).contains("Gói Pro hết hạn hôm nay lúc 12:00");
        assertThat(status(dangKy)).isEqualTo("HIEU_LUC");

        expiry.run(at(d, 12, 0));
        expiry.run(at(d, 12, 15));
        assertThat(status(dangKy)).isEqualTo("HET_HAN");
        assertThat(notices(user, "GOI_DA_HET_HAN")).singleElement().asString().contains("Gói Pro đã hết hạn lúc 12:00");
        assertThat(jdbc.queryForObject("SELECT lien_ket FROM thong_bao WHERE nguoi_dung_id = ? AND loai = 'GOI_DA_HET_HAN'",
                String.class, user)).isEqualTo("/thanh-toan-goi?lyDo=HET_HAN");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ? AND hien_thi = TRUE",
                Integer.class, user)).isEqualTo(4);
    }

    @Test
    void tc23_renewalInLastWeekStopsReminders() {
        LocalDate today = LocalDate.now(VN);
        LocalDate d = today.plusDays(3);
        Long user = learner();
        Long dangKy = subscription(user, "PREMIUM", at(d, 12, 0));

        expiry.run(at(today.plusDays(1), 9, 0));
        assertThat(notices(user, "GOI_SAP_HET_HAN")).singleElement().asString().contains("Gói Premium còn 2 ngày");

        jdbc.update("UPDATE dang_ky_goi SET het_han_at = het_han_at + INTERVAL 1 MONTH WHERE id = ?", dangKy);
        expiry.run(at(today.plusDays(2), 9, 0));
        expiry.run(at(d, 12, 30));
        assertThat(notices(user, "GOI_SAP_HET_HAN")).hasSize(1);
        assertThat(notices(user, "GOI_DA_HET_HAN")).isEmpty();
        assertThat(status(dangKy)).isEqualTo("HIEU_LUC");
    }

    @Test
    void tc23_stalePendingOrdersExpire() {
        Long user = learner();
        String cu = "DH" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        String moi = "DH" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        order(user, cu, 16);
        order(user, moi, 5);

        expiry.run(Instant.now());

        assertThat(orderStatus(cu)).isEqualTo("HET_HAN");
        assertThat(orderStatus(moi)).isEqualTo("CHO_THANH_TOAN");
    }

    private Instant at(LocalDate date, int hour, int minute) {
        return date.atTime(LocalTime.of(hour, minute)).atZone(VN).toInstant();
    }

    private Long learner() {
        NguoiDung user = NguoiDung.register(UUID.randomUUID() + "@test.local", "Expiry tester", "x",
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        user.verifyEmail(Instant.now());
        return users.saveAndFlush(user).getId();
    }

    private Long subscription(Long user, String goiMa, Instant hetHan) {
        jdbc.update("""
                INSERT INTO dang_ky_goi (nguoi_dung_id, goi_ma, bat_dau_at, het_han_at, trang_thai)
                VALUES (?, ?, ?, ?, 'HIEU_LUC')
                """, user, goiMa, utc(hetHan.minus(30, ChronoUnit.DAYS)), utc(hetHan));
        return jdbc.queryForObject("SELECT id FROM dang_ky_goi WHERE nguoi_dung_id = ?", Long.class, user);
    }

    private void order(Long user, String maDon, int phutTruoc) {
        jdbc.update("""
                INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, tao_at)
                VALUES (?, ?, 'PRO', 'THANG', 299000, 'MO_PHONG', 'CHO_THANH_TOAN', UTC_TIMESTAMP(3) - INTERVAL ? MINUTE)
                """, maDon, user, phutTruoc);
    }

    private List<String> notices(Long user, String loai) {
        return jdbc.queryForList("""
                SELECT noi_dung FROM thong_bao WHERE nguoi_dung_id = ? AND loai = ? ORDER BY ngay_dia_phuong, id
                """, String.class, user, loai);
    }

    private String status(Long dangKy) {
        return jdbc.queryForObject("SELECT trang_thai FROM dang_ky_goi WHERE id = ?", String.class, dangKy);
    }

    private String orderStatus(String maDon) {
        return jdbc.queryForObject("SELECT trang_thai FROM giao_dich_thanh_toan WHERE ma_don = ?", String.class, maDon);
    }

    private static String utc(Instant instant) {
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")
                .format(instant.atZone(ZoneId.of("UTC")));
    }
}
