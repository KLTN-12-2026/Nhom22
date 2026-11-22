package com.do_an_tot_nghiep.k28.common.exception;

import java.util.Map;
import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String field;
    private final Long retryAfterSeconds;
    private final Map<String, Object> details;

    public ApiException(ErrorCode errorCode, String message) {
        this(errorCode, null, message);
    }

    public ApiException(ErrorCode errorCode, String field, String message) {
        this(errorCode, field, message, null);
    }

    public ApiException(ErrorCode errorCode, String message, long retryAfterSeconds) {
        this(errorCode, null, message, retryAfterSeconds);
    }

    public ApiException(ErrorCode errorCode, String message, Map<String, Object> details) {
        this(errorCode, null, message, null, details);
    }

    public ApiException(ErrorCode errorCode, String message, long retryAfterSeconds, Map<String, Object> details) {
        this(errorCode, null, message, retryAfterSeconds, details);
    }

    private ApiException(ErrorCode errorCode, String field, String message, Long retryAfterSeconds) {
        this(errorCode, field, message, retryAfterSeconds, null);
    }

    private ApiException(ErrorCode errorCode, String field, String message, Long retryAfterSeconds,
                         Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.field = field;
        this.retryAfterSeconds = retryAfterSeconds;
        this.details = details;
    }
}
