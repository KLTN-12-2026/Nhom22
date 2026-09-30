package com.do_an_tot_nghiep.k28.common.exception;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException{

    private final ErrorCode errorCode;
    private final String field;

    public ApiException(ErrorCode errorCode, String message) {
        this(errorCode, null, message);
    }

    public ApiException(ErrorCode errorCode, String field, String message) {
        super(message);
        this.errorCode = errorCode;
        this.field = field;
    }
}
