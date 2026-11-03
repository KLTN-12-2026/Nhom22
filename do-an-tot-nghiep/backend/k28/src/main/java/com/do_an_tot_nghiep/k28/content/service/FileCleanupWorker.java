package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.storage.S3Properties;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.files.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class FileCleanupWorker {

    private final TepTinRepository files;
    private final StorageService storage;
    private final S3Properties props;
    private final Clock clock;
    private String pendingToken;
    private String filesToken;

    @Scheduled(initialDelayString = "${app.files.cleanup.initial-delay-ms:60000}",
            fixedDelayString = "${app.files.cleanup.interval-ms:60000}")
    public synchronized void cleanup() {
        Instant now = clock.instant();
        try {
            files.expirePending(now.minus(FileService.PENDING_TTL), now,
                    TrangThaiXoaTep.CON_HIEU_LUC, TrangThaiXoaTep.DA_XOA);
            for (var file : files.awaitingDeletion(TrangThaiXoaTep.DA_XOA, PageRequest.of(0, 100))) {
                try {
                    storage.delete(file.getObjectKey());
                    files.recordDeletion(file.getId(), TrangThaiXoaTep.DA_XOA, clock.instant());
                } catch (ApiException | DataAccessException e) {
                    log.warn("File deletion will be retried: {}", file.getId());
                }
            }
            Instant cutoff = now.minus(FileService.PENDING_TTL).minus(props.presignTtl());
            pendingToken = scan("pending/", pendingToken, cutoff);
            filesToken = scan("files/", filesToken, cutoff);
        } catch (ApiException | DataAccessException e) {
            pendingToken = null;
            filesToken = null;
            log.warn("File cleanup will be retried");
        }
    }

    private String scan(String prefix, String token, Instant cutoff) {
        var page = storage.list(prefix, token);
        for (var object : page.objects()) {
            if (object.lastModified().isBefore(cutoff)
                    && !files.existsByObjectKeyAndTrangThaiXoa(object.key(), TrangThaiXoaTep.CON_HIEU_LUC)) {
                storage.delete(object.key());
            }
        }
        return page.nextToken();
    }
}
