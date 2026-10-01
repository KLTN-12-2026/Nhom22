package com.do_an_tot_nghiep.k28.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),
    VERSION_CONFLICT(HttpStatus.CONFLICT),
    BUSINESS_RULE(HttpStatus.UNPROCESSABLE_CONTENT),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
    DEPENDENCY_DOWN(HttpStatus.SERVICE_UNAVAILABLE),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),
    TOKEN_INVALID(HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN),
    ACCOUNT_LOCKED(HttpStatus.FORBIDDEN),
    OAUTH_LINK_REQUIRED(HttpStatus.CONFLICT);

    private final HttpStatus status;
}
