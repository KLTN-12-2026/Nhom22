package com.do_an_tot_nghiep.k28.common.exception;

import com.do_an_tot_nghiep.k28.common.web.RequestIdFilter;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
        return build(ex.getErrorCode(), ex.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldErrorItem> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> new ErrorResponse.FieldErrorItem(f.getField(), f.getDefaultMessage()))
                .toList();
        return build(ErrorCode.VALIDATION_FAILED, "Dữ liệu không hợp lệ", fields);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        return build(ErrorCode.VALIDATION_FAILED, "Yêu cầu không đúng định dạng", List.of());
    }

    @ExceptionHandler({NoResourceFoundException.class, HttpRequestMethodNotSupportedException.class})
    ResponseEntity<ErrorResponse> handleNoRoute(Exception ex) {
        return build(ErrorCode.NOT_FOUND, "Không tìm thấy đường dẫn", List.of());
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ErrorResponse> handleVersion(OptimisticLockingFailureException ex) {
        return build(ErrorCode.VERSION_CONFLICT, "Dữ liệu đã bị thay đổi, vui lòng tải lại", List.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> handleDenied(AccessDeniedException ex) {
        return build(ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này", List.of());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled error", ex);
        return build(ErrorCode.INTERNAL_ERROR, "Hệ thống đang gặp sự cố, vui lòng thử lại sau", List.of());
    }

    private ResponseEntity<ErrorResponse> build(ErrorCode code, String message,
                                                List<ErrorResponse.FieldErrorItem> fields) {
        ErrorResponse body = new ErrorResponse(code.name(), message, fields, MDC.get(RequestIdFilter.MDC_KEY));
        return ResponseEntity.status(code.getStatus()).body(body);
    }
}
