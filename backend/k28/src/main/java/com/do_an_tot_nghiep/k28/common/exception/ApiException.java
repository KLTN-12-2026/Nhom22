package com.do_an_tot_nghiep.k28.common.exception;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException{

    private final ErrorCode errorCode;
    private final String field;
    private final Long retryAfterSeconds;

    public ApiException(ErrorCode errorCode, String message) {
        this(errorCode, null, message);
    }

    public ApiException(ErrorCode errorCode, String field, String message) {
        this(errorCode, field, message, null);
    }

    public ApiException(ErrorCode errorCode, String message, long retryAfterSeconds) {
        this(errorCode, null, message, retryAfterSeconds);
    }

    private ApiException(ErrorCode errorCode, String field, String message, Long retryAfterSeconds) {
        super(message);
        this.errorCode = errorCode;
        this.field = field;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
