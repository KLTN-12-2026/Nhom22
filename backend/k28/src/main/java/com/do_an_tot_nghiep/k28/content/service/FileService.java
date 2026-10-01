package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequest;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequestResponse;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.mapper.FileMapper;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import java.time.Clock;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class FileService {

    public static final Duration PENDING_TTL = Duration.ofHours(24);

    private static final RateLimiter.Policy UPLOAD =
            new RateLimiter.Policy("file-upload", 30, Duration.ofMinutes(1));

    private final TepTinRepository files;
    private final StorageService storage;
    private final FileVerifier verifier;
    private final FileMapper mapper;
    private final RateLimiter rateLimiter;
    private final PlatformTransactionManager txManager;
    private final Clock clock;
    private final AccountService accountService;

    public UploadRequestResponse requestUpload(Long userId, UploadRequest request) {
        rateLimiter.check(UPLOAD, userId.toString());
        String mimeType = verifier.validateRequest(request);
        String key = storage.newObjectKey("pending/" + userId);
        StorageService.PresignedUrl signed =
                storage.presignPut(key, request.mimeType());

        TepTin file = new TransactionTemplate(txManager).execute(status ->
                files.saveAndFlush(TepTin.pending(
                        userId, key, mimeType, request.kichThuoc(),
                        request.checksum(), request.loai()
                ))
        );

        return new UploadRequestResponse(
                file.getId().toString(), signed.url(), signed.expiresAt()
        );
    }

    public FileResponse complete(Long userId, Long fileId) {
        rateLimiter.check(UPLOAD, userId.toString());
        TepTin snapshot = active(files.findByIdAndChuSoHuuId(fileId, userId)
                .orElseThrow(this::notFound));

        if (snapshot.getHoanTatAt() != null) {
            return response(snapshot);
        }

        requireUnexpired(snapshot);

        byte[] content = storage.readBounded(
                snapshot.getObjectKey(), verifier.maxBytes(snapshot.getLoai())
        );
        FileVerifier.VerifiedFile verified = verifier.verify(snapshot, content);
        String finalKey = storage.newObjectKey("files/" + userId);
        storage.putVerified(finalKey, content, verified.mimeType());

        TepTin completed = new TransactionTemplate(txManager).execute(status -> {
            TepTin current = active(files.findOwnedForUpdate(fileId, userId)
                    .orElseThrow(this::notFound));

            if (current.getHoanTatAt() != null) {
                return current;
            }
            requireUnexpired(current);
            if (!current.getObjectKey().equals(snapshot.getObjectKey())) {
                throw new ApiException(
                        ErrorCode.CONFLICT, "Trạng thái tệp đã thay đổi"
                );
            }

            current.complete(
                    finalKey, verified.mimeType(), verified.kichThuoc(),
                    verified.checksum(), clock.instant()
            );
            return current;
        });

        if (!completed.getObjectKey().equals(finalKey)) {
            deleteUnused(finalKey);
        }
        return response(completed);
    }

    public FileResponse get(Long userId, Long fileId) {
        TepTin file = active(files.findByIdAndChuSoHuuId(fileId, userId).orElseThrow(this::notFound));
        if (file.getHoanTatAt() == null) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Tệp chưa hoàn tất tải lên");
        }
        return response(file);
    }

    public FileResponse setAvatar(Long userId, Long fileId) {
        TepTin file = new TransactionTemplate(txManager).execute(status -> {
            TepTin current = active(files.findOwnedForUpdate(fileId, userId).orElseThrow(this::notFound));
            if (current.getLoai() != LoaiTep.ANH || current.getHoanTatAt() == null) {
                throw new ApiException(ErrorCode.BUSINESS_RULE, "Ảnh đại diện phải là tệp ảnh đã hoàn tất");
            }
            accountService.changeAvatar(userId, fileId);
            return current;
        });
        return response(file);
    }

    public FileResponse avatar(Long userId) {
        Long id = accountService.avatarId(userId);
        return id == null ? null : get(userId, id);
    }

    public void delete(Long userId, Long fileId) {
        TepTin deleted = new TransactionTemplate(txManager).execute(status -> {
            TepTin file = files.findOwnedForUpdate(fileId, userId).orElseThrow(this::notFound);
            accountService.clearAvatarIfMatches(userId, fileId);
            if (file.getTrangThaiXoa() != TrangThaiXoaTep.DA_XOA) {
                file.markDeleted(clock.instant());
            }
            return file;
        });
        storage.delete(deleted.getObjectKey());
        files.recordDeletion(fileId, TrangThaiXoaTep.DA_XOA, clock.instant());
    }

    private void requireUnexpired(TepTin file) {
        if (!clock.instant().isBefore(file.getCreatedAt().plus(PENDING_TTL))) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Yêu cầu tải lên đã hết hạn, hãy tạo yêu cầu mới");
        }
    }

    private TepTin active(TepTin file) {
        if (file.getTrangThaiXoa() == TrangThaiXoaTep.DA_XOA) {
            throw notFound();
        }
        return file;
    }

    private FileResponse response(TepTin file) {
        StorageService.PresignedUrl signed =
                storage.presignGet(file.getObjectKey());
        return mapper.toResponse(file, signed.url(), signed.expiresAt());
    }

    private void deleteUnused(String key) {
        try {
            storage.delete(key);
        } catch (ApiException e) {
            log.warn("Could not remove unused upload object");
        }
    }

    private ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy tệp");
    }
}
