package com.do_an_tot_nghiep.k28.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;

public record ErrorResponse(
        String code,
        String message,
        List<FieldErrorItem> fieldErrors,
        String requestId,
        @JsonInclude(JsonInclude.Include.NON_NULL) Map<String, Object> details
) {

    public ErrorResponse(String code, String message, List<FieldErrorItem> fieldErrors, String requestId) {
        this(code, message, fieldErrors, requestId, null);
    }

    public record FieldErrorItem(
            String field,
            String message
    ) {
    }
}
