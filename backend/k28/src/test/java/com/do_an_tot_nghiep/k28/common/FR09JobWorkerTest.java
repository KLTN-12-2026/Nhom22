package com.do_an_tot_nghiep.k28.common;

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
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import com.do_an_tot_nghiep.k28.support.MutableClock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FR09JobWorkerTest extends AbstractIntegrationTest {

    private static final String LOAI = "TEST_FR09";
    private static final JobProperties PROPS = new JobProperties(true, 5, 3, Duration.ofMinutes(10),
            Duration.ofSeconds(5), Duration.ofMinutes(5));

    @Autowired
    private JobService jobService;

    @Autowired
    private TacVuNenRepository jobs;

    @Autowired
    private TransactionTemplate tx;

    @Autowired
    private JdbcTemplate jdbc;

    private static final class Recorder implements JobHandler {

        final Map<Long, AtomicInteger> runs = new ConcurrentHashMap<>();
        final List<KetQuaTacVu> finished = new CopyOnWriteArrayList<>();
        private final Function<TacVuNen, Throwable> failure;

        Recorder(Function<TacVuNen, Throwable> failure) {
            this.failure = failure;
        }

        @Override
        public String loai() {
            return LOAI;
        }

        @Override
        public void xuLy(TacVuNen job) {
            runs.computeIfAbsent(job.getId(), id -> new AtomicInteger()).incrementAndGet();
            Throwable error = failure.apply(job);
            if (error instanceof RuntimeException runtime) {
                throw runtime;
            }
            if (error instanceof Error fatal) {
                throw fatal;
            }
        }

        @Override
        public void khiKetThuc(TacVuNen job, KetQuaTacVu ketQua) {
            finished.add(ketQua);
        }
    }

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM tac_vu_nen");
    }

    private Long enqueue(String loai) {
        return tx.execute(status -> jobService.enqueue(loai, Map.of("k", "v")));
    }

    private JobWorker worker(JobHandler handler, MutableClock clock) {
        return new JobWorker(List.of(handler), jobs, tx, PROPS, clock);
    }

    private MutableClock futureClock() {
        return new MutableClock(Instant.now().truncatedTo(ChronoUnit.MILLIS).plusSeconds(1));
    }

    @Test
    void fr09_enqueueRequiresSurroundingTransaction() {
        assertThatThrownBy(() -> jobService.enqueue(LOAI, Map.of("k", "v")))
                .isInstanceOf(IllegalTransactionStateException.class);
    }

    @Test
    void fr09_twoWorkersNeverTakeTheSameJob() throws Exception {
        List<Long> ids = IntStream.range(0, 20).mapToObj(i -> enqueue(LOAI)).toList();
        Recorder recorder = new Recorder(job -> null);
        MutableClock clock = futureClock();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (String name : List.of("w1", "w2")) {
            JobWorker worker = worker(recorder, clock);
            results.add(pool.submit(() -> {
                start.await();
                int total = 0;
                int taken;
                while ((taken = worker.runOnce(name)) > 0) {
                    total += taken;
                }
                return total;
            }));
        }
        start.countDown();
        int total = 0;
        for (Future<Integer> result : results) {
            total += result.get(60, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertThat(total).isEqualTo(20);
        assertThat(recorder.runs).hasSize(20);
        assertThat(recorder.runs.values()).allSatisfy(count -> assertThat(count.get()).isEqualTo(1));
        assertThat(jobs.findAllById(ids)).allSatisfy(job ->
                assertThat(job.getTrangThai()).isEqualTo(TrangThaiTacVu.XONG));
    }

    @Test
    void tc12_retryBacksOffAndStopsAtMaxRetry() {
        Long id = enqueue(LOAI);
        Recorder recorder = new Recorder(job -> new JobException(Kieu.THU_LAI, "PROVIDER_5XX"));
        MutableClock clock = futureClock();
        JobWorker worker = worker(recorder, clock);
        Duration[] waits = {Duration.ofSeconds(5), Duration.ofSeconds(10), Duration.ofSeconds(20)};

        for (int retry = 1; retry <= 3; retry++) {
            assertThat(worker.runOnce("w")).isEqualTo(1);
            TacVuNen job = jobs.findById(id).orElseThrow();
            assertThat(job.getTrangThai()).isEqualTo(TrangThaiTacVu.CHO);
            assertThat(job.getRetryCount()).isEqualTo(retry);
            assertThat(job.getNextRunAt()).isEqualTo(clock.instant().plus(waits[retry - 1]));
            assertThat(worker.runOnce("w")).isZero();
            clock.advance(waits[retry - 1]);
        }

        assertThat(worker.runOnce("w")).isEqualTo(1);
        TacVuNen job = jobs.findById(id).orElseThrow();
        assertThat(job.getTrangThai()).isEqualTo(TrangThaiTacVu.LOI);
        assertThat(job.getRetryCount()).isEqualTo(3);
        assertThat(job.getMaLoi()).isEqualTo("PROVIDER_5XX");
        assertThat(recorder.runs.get(id).get()).isEqualTo(4);
        assertThat(recorder.finished).containsExactly(new KetQuaTacVu(TrangThaiTacVu.LOI, "PROVIDER_5XX"));

        clock.advance(Duration.ofHours(1));
        assertThat(worker.runOnce("w")).isZero();
    }

    @Test
    void fr09_definiteFailureUnknownOutcomeAndBugsDoNotRetry() {
        Long definite = enqueue(LOAI);
        Long unknown = enqueue(LOAI);
        Long bug = enqueue(LOAI);
        Long unregistered = enqueue("KHONG_CO");
        Recorder recorder = new Recorder(job -> {
            if (job.getId().equals(definite)) {
                return new JobException(Kieu.LOI, "BAD_REQUEST");
            }
            if (job.getId().equals(unknown)) {
                return new JobException(Kieu.KHONG_XAC_DINH, "READ_TIMEOUT");
            }
            return new IllegalStateException("boom");
        });
        JobWorker worker = worker(recorder, futureClock());

        assertThat(worker.runOnce("w")).isEqualTo(4);

        assertState(definite, TrangThaiTacVu.LOI, "BAD_REQUEST");
        assertState(unknown, TrangThaiTacVu.KHONG_XAC_DINH, "READ_TIMEOUT");
        assertState(bug, TrangThaiTacVu.LOI, "NOI_BO");
        assertState(unregistered, TrangThaiTacVu.LOI, "CHUA_DANG_KY");
        assertThat(recorder.runs.get(definite).get()).isEqualTo(1);
        assertThat(recorder.runs.get(unknown).get()).isEqualTo(1);
        assertThat(recorder.runs.get(bug).get()).isEqualTo(1);
        assertThat(recorder.finished).containsExactlyInAnyOrder(
                new KetQuaTacVu(TrangThaiTacVu.LOI, "BAD_REQUEST"),
                new KetQuaTacVu(TrangThaiTacVu.KHONG_XAC_DINH, "READ_TIMEOUT"),
                new KetQuaTacVu(TrangThaiTacVu.LOI, "NOI_BO"));
    }

    @Test
    void fr09_expiredLeaseBecomesUnknownOutcome() {
        Long id = enqueue(LOAI);
        MutableClock clock = futureClock();
        Recorder dying = new Recorder(job -> new Error("worker died"));
        assertThatThrownBy(() -> worker(dying, clock).runOnce("w1")).isInstanceOf(Error.class);
        assertThat(jobs.findById(id).orElseThrow().getTrangThai()).isEqualTo(TrangThaiTacVu.DANG_CHAY);

        Recorder survivor = new Recorder(job -> null);
        JobWorker second = worker(survivor, clock);
        assertThat(second.runOnce("w2")).isZero();
        assertThat(jobs.findById(id).orElseThrow().getTrangThai()).isEqualTo(TrangThaiTacVu.DANG_CHAY);

        clock.advance(Duration.ofMinutes(11));
        assertThat(second.runOnce("w2")).isZero();

        assertState(id, TrangThaiTacVu.KHONG_XAC_DINH, "LEASE_HET_HAN");
        assertThat(jobs.findById(id).orElseThrow().getKhoaBoi()).isNull();
        assertThat(survivor.runs).isEmpty();
        assertThat(survivor.finished).containsExactly(
                new KetQuaTacVu(TrangThaiTacVu.KHONG_XAC_DINH, "LEASE_HET_HAN"));
    }

    private void assertState(Long id, TrangThaiTacVu state, String maLoi) {
        TacVuNen job = jobs.findById(id).orElseThrow();
        assertThat(job.getTrangThai()).isEqualTo(state);
        assertThat(job.getMaLoi()).isEqualTo(maLoi);
        assertThat(job.getRetryCount()).isZero();
    }
}
