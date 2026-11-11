package com.do_an_tot_nghiep.k28.common;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import com.do_an_tot_nghiep.k28.common.job.JobHandler;
import com.do_an_tot_nghiep.k28.common.job.JobProperties;
import com.do_an_tot_nghiep.k28.common.job.JobService;
import com.do_an_tot_nghiep.k28.common.job.JobWorker;
import com.do_an_tot_nghiep.k28.common.job.KetQuaTacVu;
import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.job.entity.enums.TrangThaiTacVu;
import com.do_an_tot_nghiep.k28.common.job.repository.TacVuNenRepository;
import com.do_an_tot_nghiep.k28.common.quota.GiuCho;
import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import com.do_an_tot_nghiep.k28.common.quota.QuotaProperties;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import com.do_an_tot_nghiep.k28.common.quota.repository.HanMucDichVuRepository;
import com.do_an_tot_nghiep.k28.common.quota.repository.SuDungDichVuRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import com.do_an_tot_nghiep.k28.support.MutableClock;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FR09QuotaTest extends AbstractIntegrationTest {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private NguoiDungRepository users;

    @Autowired
    private VaiTroRepository roles;

    @Autowired
    private QuotaService quota;

    @Autowired
    private SuDungDichVuRepository usage;

    @Autowired
    private HanMucDichVuRepository limits;

    @Autowired
    private GoiDichVuResolver plans;

    @Autowired
    private JobService jobService;

    @Autowired
    private TacVuNenRepository jobs;

    @Autowired
    private TransactionTemplate tx;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void setLimits() {
        jdbc.update("DELETE FROM tac_vu_nen");
        setLimit("AI", 5);
        setLimit("ANH", 2);
    }

    @AfterEach
    void restoreLimits() {
        setLimit("AI", 20);
        setLimit("ANH", 10);
    }

    private void setLimit(String loai, int value) {
        jdbc.update("UPDATE han_muc_dich_vu SET so_luot_ngay = ? WHERE goi_ma = 'PRO' AND loai = ?", value, loai);
    }

    private Long newUser() {
        return users.saveAndFlush(NguoiDung.register(UUID.randomUUID() + "@test.local", "Quota tester", "hash",
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow())).getId();
    }

    private GiuCho reserve(Long userId, LoaiDichVu loai) {
        return tx.execute(status -> quota.giuCho(userId, loai));
    }

    private int total(Long userId, String loai, String column) {
        Integer value = jdbc.queryForObject(
                "SELECT COALESCE(SUM(" + column + "), 0) FROM su_dung_dich_vu WHERE nguoi_dung_id = ? AND loai = ?",
                Integer.class, userId, loai);
        return value == null ? 0 : value;
    }

    private QuotaService serviceAt(String instant) {
        Clock clock = Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
        return new QuotaService(usage, limits, plans, new QuotaProperties(VN), clock);
    }

    @Test
    void tc12_concurrentReservationsNeverExceedLimit() throws Exception {
        Long userId = newUser();
        ExecutorService pool = Executors.newFixedThreadPool(10);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = IntStream.range(0, 10)
                .mapToObj(i -> pool.submit(() -> {
                    start.await();
                    try {
                        reserve(userId, LoaiDichVu.AI);
                        return true;
                    } catch (ApiException e) {
                        assertThat(e.getErrorCode()).isEqualTo(ErrorCode.RATE_LIMITED);
                        return false;
                    }
                }))
                .toList();
        start.countDown();
        long granted = 0;
        for (Future<Boolean> result : results) {
            if (result.get(60, TimeUnit.SECONDS)) {
                granted++;
            }
        }
        pool.shutdown();

        assertThat(granted).isEqualTo(5);
        assertThat(total(userId, "AI", "so_giu")).isEqualTo(5);
        assertThat(total(userId, "AI", "so_dung")).isZero();
    }

    @Test
    void tc12_exhaustedQuotaReturns429WithRetryAfterAndNewDayStartsFresh() {
        setLimit("AI", 1);
        Long userId = newUser();
        QuotaService beforeMidnight = serviceAt("2026-11-10T16:59:59Z");
        QuotaService afterMidnight = serviceAt("2026-11-10T17:00:00Z");

        GiuCho first = tx.execute(status -> beforeMidnight.giuCho(userId, LoaiDichVu.AI));
        assertThat(first.ngay()).isEqualTo(LocalDate.of(2026, 11, 10));

        assertThatThrownBy(() -> tx.execute(status -> beforeMidnight.giuCho(userId, LoaiDichVu.AI)))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.RATE_LIMITED);
                    assertThat(e.getErrorCode().getStatus().value()).isEqualTo(429);
                    assertThat(e.getRetryAfterSeconds()).isEqualTo(1L);
                });

        GiuCho next = tx.execute(status -> afterMidnight.giuCho(userId, LoaiDichVu.AI));
        assertThat(next.ngay()).isEqualTo(LocalDate.of(2026, 11, 11));
        assertThat(total(userId, "AI", "so_giu")).isEqualTo(2);
    }

    @Test
    void tc12_imageQuotaIsSeparateFromTextQuota() {
        Long userId = newUser();
        reserve(userId, LoaiDichVu.ANH);
        reserve(userId, LoaiDichVu.ANH);

        assertThatThrownBy(() -> reserve(userId, LoaiDichVu.ANH))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.RATE_LIMITED));
        reserve(userId, LoaiDichVu.AI);

        assertThat(total(userId, "ANH", "so_giu")).isEqualTo(2);
        assertThat(total(userId, "AI", "so_giu")).isEqualTo(1);
    }

    @Test
    void tc12_refundFreesASlotAndConfirmCountsAsUsed() {
        Long userId = newUser();
        List<GiuCho> held = IntStream.range(0, 5).mapToObj(i -> reserve(userId, LoaiDichVu.AI)).toList();
        assertThatThrownBy(() -> reserve(userId, LoaiDichVu.AI)).isInstanceOf(ApiException.class);

        tx.executeWithoutResult(status -> quota.hoanTra(userId, held.get(0)));
        assertThat(total(userId, "AI", "so_giu")).isEqualTo(4);
        reserve(userId, LoaiDichVu.AI);
        assertThatThrownBy(() -> reserve(userId, LoaiDichVu.AI)).isInstanceOf(ApiException.class);

        tx.executeWithoutResult(status -> quota.xacNhan(userId, held.get(1)));
        assertThat(total(userId, "AI", "so_giu")).isEqualTo(4);
        assertThat(total(userId, "AI", "so_dung")).isEqualTo(1);
        assertThatThrownBy(() -> reserve(userId, LoaiDichVu.AI)).isInstanceOf(ApiException.class);
    }

    @Test
    void tc12_definiteFailureRefundsAndUnknownOutcomeStaysUsed() {
        Long userId = newUser();
        QuotaHandler handler = new QuotaHandler();
        Long definite = reserveAndEnqueue(userId, handler, Kieu.LOI);
        Long unknown = reserveAndEnqueue(userId, handler, Kieu.KHONG_XAC_DINH);
        assertThat(total(userId, "AI", "so_giu")).isEqualTo(2);

        JobProperties props = new JobProperties(true, 5, 3, Duration.ofMinutes(10),
                Duration.ofSeconds(5), Duration.ofMinutes(5));
        MutableClock clock = new MutableClock(Instant.now().truncatedTo(ChronoUnit.MILLIS).plusSeconds(1));
        assertThat(new JobWorker(List.of(handler), jobs, tx, props, clock).runOnce("w")).isEqualTo(2);

        assertThat(jobs.findById(definite).orElseThrow().getTrangThai()).isEqualTo(TrangThaiTacVu.LOI);
        assertThat(jobs.findById(unknown).orElseThrow().getTrangThai()).isEqualTo(TrangThaiTacVu.KHONG_XAC_DINH);
        assertThat(total(userId, "AI", "so_giu")).isZero();
        assertThat(total(userId, "AI", "so_dung")).isEqualTo(1);
    }

    private Long reserveAndEnqueue(Long userId, QuotaHandler handler, Kieu kieu) {
        return tx.execute(status -> {
            GiuCho held = quota.giuCho(userId, LoaiDichVu.AI);
            Long jobId = jobService.enqueue(QuotaHandler.LOAI, Map.of("userId", userId));
            handler.register(jobId, userId, held, kieu);
            return jobId;
        });
    }

    private final class QuotaHandler implements JobHandler {

        static final String LOAI = "TEST_QUOTA";

        private record Entry(Long userId, GiuCho held, Kieu kieu) {
        }

        private final Map<Long, Entry> entries = new HashMap<>();

        void register(Long jobId, Long userId, GiuCho held, Kieu kieu) {
            entries.put(jobId, new Entry(userId, held, kieu));
        }

        @Override
        public String loai() {
            return LOAI;
        }

        @Override
        public void xuLy(TacVuNen job) {
            throw new JobException(entries.get(job.getId()).kieu(), "TEST_FAILURE");
        }

        @Override
        public void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
            Entry entry = entries.get(job.getId());
            if (ketQua.trangThai() == TrangThaiTacVu.LOI) {
                quota.hoanTra(entry.userId(), entry.held());
            } else {
                quota.xacNhan(entry.userId(), entry.held());
            }
        }
    }
}
