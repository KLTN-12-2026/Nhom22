package com.do_an_tot_nghiep.k28.common.storage;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
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

    public record StoredObject(String key, Instant lastModified) {
    }

    public record ObjectPage(List<StoredObject> objects, String nextToken) {
    }

    public ObjectPage list(String prefix, String token) {
        try {
            ListObjectsV2Response page = s3.listObjectsV2(r -> r.bucket(props.bucket())
                    .prefix(prefix).continuationToken(token).maxKeys(100));
            return new ObjectPage(page.contents().stream()
                    .map(o -> new StoredObject(o.key(), o.lastModified())).toList(), page.nextContinuationToken());
        } catch (SdkException e) {
            throw unavailable(e);
        }
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
        log.warn("Storage call failed: {}", e.getClass().getSimpleName());
        return new ApiException(ErrorCode.DEPENDENCY_DOWN, "Dịch vụ lưu trữ tạm thời không khả dụng");
    }

    public byte[] readBounded(String key, int maxBytes) {
        if (maxBytes <= 0 || maxBytes == Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Invalid read limit");
        }

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .build();

        try (ResponseInputStream<GetObjectResponse> object = s3.getObject(request)) {
            Long contentLength = object.response().contentLength();
            if (contentLength != null && contentLength > maxBytes) {
                object.abort();
                throw new ApiException(
                        ErrorCode.BUSINESS_RULE,
                        "Tệp vượt quá dung lượng cho phép"
                );
            }

            byte[] content = object.readNBytes(maxBytes + 1);
            if (content.length > maxBytes) {
                object.abort();
                throw new ApiException(
                        ErrorCode.BUSINESS_RULE,
                        "Tệp vượt quá dung lượng cho phép"
                );
            }
            return content;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                throw new ApiException(
                        ErrorCode.BUSINESS_RULE,
                        "Tệp chưa được tải lên"
                );
            }
            throw unavailable(e);
        } catch (SdkException e) {
            throw unavailable(e);
        } catch (IOException e) {
            throw new ApiException(
                    ErrorCode.DEPENDENCY_DOWN,
                    "Không thể đọc tệp từ dịch vụ lưu trữ"
            );
        }
    }

    public void putVerified(String key, byte[] content, String mimeType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .contentType(mimeType)
                .build();

        try {
            s3.putObject(request, RequestBody.fromBytes(content));
        } catch (SdkException e) {
            throw unavailable(e);
        }
    }
}
