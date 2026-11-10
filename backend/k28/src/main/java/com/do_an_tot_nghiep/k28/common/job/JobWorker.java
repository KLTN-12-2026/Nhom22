package com.do_an_tot_nghiep.k28.common.job;

import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.job.entity.enums.TrangThaiTacVu;
import com.do_an_tot_nghiep.k28.common.job.repository.TacVuNenRepository;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Component
public class JobWorker {

    private record Outcome(TrangThaiTacVu to, int retry, Instant next, String maLoi) {
    }

    private final Map<String, JobHandler> handlers = new HashMap<>();
    private final TacVuNenRepository jobs;
    private final TransactionTemplate tx;
    private final JobProperties props;
    private final Clock clock;
    private final String workerId = "worker-" + UUID.randomUUID().toString().substring(0, 8);

    @Autowired
    public JobWorker(ObjectProvider<JobHandler> handlers, TacVuNenRepository jobs, TransactionTemplate tx,
                     JobProperties props, Clock clock) {
        this(handlers.orderedStream().toList(), jobs, tx, props, clock);
    }

    public JobWorker(List<JobHandler> handlers, TacVuNenRepository jobs, TransactionTemplate tx,
                     JobProperties props, Clock clock) {
        handlers.forEach(handler -> this.handlers.put(handler.loai(), handler));
        this.jobs = jobs;
        this.tx = tx;
        this.props = props;
        this.clock = clock;
    }

    @Scheduled(initialDelayString = "${app.jobs.initial-delay-ms:10000}",
            fixedDelayString = "${app.jobs.interval-ms:5000}")
    public void poll() {
        if (!props.enabled()) {
            return;
        }
        try {
            runOnce(workerId);
        } catch (DataAccessException e) {
            log.warn("Job polling will be retried");
        }
    }

    public int runOnce(String worker) {
        recoverExpired();
        List<TacVuNen> claimed = tx.execute(status -> {
            Instant now = clock.instant();
            List<TacVuNen> batch = jobs.claim(now, props.batchSize());
            Instant lease = now.plus(props.lease());
            batch.forEach(job -> job.batDau(worker, lease));
            return batch;
        });
        for (TacVuNen job : claimed) {
            run(job, worker);
        }
        return claimed.size();
    }

    private void run(TacVuNen job, String worker) {
        JobHandler handler = handlers.get(job.getLoai());
        Outcome outcome;
        if (handler == null) {
            outcome = new Outcome(TrangThaiTacVu.LOI, job.getRetryCount(), job.getNextRunAt(), "CHUA_DANG_KY");
        } else {
            try {
                handler.xuLy(job);
                outcome = new Outcome(TrangThaiTacVu.XONG, job.getRetryCount(), job.getNextRunAt(), null);
            } catch (JobException e) {
                outcome = outcomeOf(job, e);
            } catch (RuntimeException e) {
                log.warn("Job {} ({}) failed unexpectedly: {}", job.getId(), job.getLoai(),
                        e.getClass().getSimpleName());
                outcome = new Outcome(TrangThaiTacVu.LOI, job.getRetryCount(), job.getNextRunAt(), "NOI_BO");
            }
        }
        finish(job, worker, handler, outcome);
    }

    private Outcome outcomeOf(TacVuNen job, JobException e) {
        return switch (e.getKieu()) {
            case THU_LAI -> job.getRetryCount() < job.getMaxRetry()
                    ? new Outcome(TrangThaiTacVu.CHO, job.getRetryCount() + 1,
                    clock.instant().plus(backoff(job.getRetryCount())), e.getMaLoi())
                    : new Outcome(TrangThaiTacVu.LOI, job.getRetryCount(), job.getNextRunAt(), e.getMaLoi());
            case LOI -> new Outcome(TrangThaiTacVu.LOI, job.getRetryCount(), job.getNextRunAt(), e.getMaLoi());
            case KHONG_XAC_DINH ->
                    new Outcome(TrangThaiTacVu.KHONG_XAC_DINH, job.getRetryCount(), job.getNextRunAt(), e.getMaLoi());
        };
    }

    private Duration backoff(int retriesDone) {
        Duration delay = props.backoffBase().multipliedBy(1L << Math.min(retriesDone, 16));
        return delay.compareTo(props.backoffMax()) > 0 ? props.backoffMax() : delay;
    }

    private void finish(TacVuNen job, String worker, JobHandler handler, Outcome outcome) {
        tx.executeWithoutResult(status -> {
            int rows = jobs.chuyen(job.getId(), worker, TrangThaiTacVu.DANG_CHAY, outcome.to(),
                    outcome.retry(), outcome.next(), outcome.maLoi(), clock.instant());
            if (rows == 0) {
                log.warn("Job {} lost its lease, result discarded", job.getId());
                return;
            }
            if (outcome.to() != TrangThaiTacVu.CHO && handler != null) {
                handler.khiKetThuc(job, new KetQuaTacVu(outcome.to(), outcome.maLoi()));
            }
        });
    }

    private void recoverExpired() {
        Instant now = clock.instant();
        for (TacVuNen job : jobs.findTop50ByTrangThaiAndKhoaDenAtBefore(TrangThaiTacVu.DANG_CHAY, now)) {
            try {
                finish(job, job.getKhoaBoi(), handlers.get(job.getLoai()),
                        new Outcome(TrangThaiTacVu.KHONG_XAC_DINH, job.getRetryCount(), job.getNextRunAt(),
                                "LEASE_HET_HAN"));
            } catch (RuntimeException e) {
                log.warn("Recovery of job {} failed: {}", job.getId(), e.getClass().getSimpleName());
            }
        }
    }
}