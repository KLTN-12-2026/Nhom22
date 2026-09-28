package com.do_an_tot_nghiep.k28.common.storage;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final S3Client s3;
    private final S3Presigner presigner;
    private final S3Properties props;
    private final Clock clock;

    public record PresignedUrl(String url, Instant expiresAt) {
    }

    public record ObjectInfo(long size, String contentType) {
    }

    public String newObjectKey(String prefix) {
        return prefix + "/" + UUID.randomUUID();
    }

    public PresignedUrl presignPut(String key, String contentType) {
        PutObjectRequest object = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .contentType(contentType)
                .build();
        String url = presigner.presignPutObject(r -> r.signatureDuration(props.presignTtl()).putObjectRequest(object))
                .url().toString();
        return new PresignedUrl(url, expiresAt());
    }

    public PresignedUrl presignGet(String key) {
        GetObjectRequest object = GetObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .build();
        String url = presigner.presignGetObject(r -> r.signatureDuration(props.presignTtl()).getObjectRequest(object))
                .url().toString();
        return new PresignedUrl(url, expiresAt());
    }

    public Optional<ObjectInfo> head(String key) {
        try {
            HeadObjectResponse response = s3.headObject(r -> r.bucket(props.bucket()).key(key));
            return Optional.of(new ObjectInfo(response.contentLength(), response.contentType()));
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return Optional.empty();
            }
            throw unavailable(e);
        } catch (SdkException e) {
            throw unavailable(e);
        }
    }

    public void delete(String key) {
        try {
            s3.deleteObject(r -> r.bucket(props.bucket()).key(key));
        } catch (SdkException e) {
            throw unavailable(e);
        }
    }

    private Instant expiresAt() {
        return clock.instant().plus(props.presignTtl());
    }

    private ApiException unavailable(SdkException e) {
        log.warn("Storage call failed: {}", e.getMessage());
        return new ApiException(ErrorCode.DEPENDENCY_DOWN, "Dịch vụ lưu trữ tạm thời không khả dụng");
    }
}
