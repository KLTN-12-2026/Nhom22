package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.storage.S3Properties;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.service.FileCleanupWorker;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FR03CleanupTest {

    private final TepTinRepository files = mock(TepTinRepository.class);
    private final StorageService storage = mock(StorageService.class);
    private final Instant now = Instant.parse("2026-10-02T00:00:00Z");
    private final S3Properties props = new S3Properties("", "", "", "", "", "", Duration.ofMinutes(10));
    private final FileCleanupWorker worker = new FileCleanupWorker(files, storage, props,
            Clock.fixed(now, ZoneOffset.UTC));

    @BeforeEach
    void emptyPages() {
        when(storage.list(anyString(), nullable(String.class)))
                .thenReturn(new StorageService.ObjectPage(List.of(), null));
    }

    @Test
    void failedDeletionRemainsPendingThenSucceeds() {
        TepTin file = mock(TepTin.class);
        when(file.getId()).thenReturn(1L);
        when(file.getObjectKey()).thenReturn("files/retry");
        when(files.awaitingDeletion(eq(TrangThaiXoaTep.DA_XOA), any())).thenReturn(List.of(file));
        doThrow(new ApiException(ErrorCode.DEPENDENCY_DOWN, "Unavailable"))
                .doNothing().when(storage).delete("files/retry");
        worker.cleanup();
        verify(files, never()).recordDeletion(anyLong(), any(), any());
        worker.cleanup();
        verify(files).recordDeletion(1L, TrangThaiXoaTep.DA_XOA, now);
        verify(files, times(2)).expirePending(now.minus(Duration.ofHours(24)), now,
                TrangThaiXoaTep.CON_HIEU_LUC, TrangThaiXoaTep.DA_XOA);
    }

    @Test
    void oldOrphansAreRemovedButLiveAndRecentObjectsRemain() {
        Instant old = now.minus(Duration.ofDays(2));
        when(storage.list("pending/", null)).thenReturn(new StorageService.ObjectPage(List.of(
                new StorageService.StoredObject("pending/orphan", old)), null));
        when(storage.list("files/", null)).thenReturn(new StorageService.ObjectPage(List.of(
                new StorageService.StoredObject("files/live", old),
                new StorageService.StoredObject("files/orphan", old),
                new StorageService.StoredObject("files/in-flight", now)), null));
        when(files.existsByObjectKeyAndTrangThaiXoa("files/live", TrangThaiXoaTep.CON_HIEU_LUC))
                .thenReturn(true);
        worker.cleanup();
        verify(storage).delete("pending/orphan");
        verify(storage).delete("files/orphan");
        verify(storage, never()).delete("files/live");
        verify(storage, never()).delete("files/in-flight");
    }

    @Test
    void continuationTokenAdvancesAcrossRuns() {
        when(storage.list("pending/", null)).thenReturn(new StorageService.ObjectPage(List.of(), "next-page"));
        worker.cleanup();
        worker.cleanup();
        verify(storage).list("pending/", "next-page");
    }
}
