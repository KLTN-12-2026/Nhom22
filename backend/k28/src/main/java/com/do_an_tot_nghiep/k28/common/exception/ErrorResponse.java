package com.do_an_tot_nghiep.k28.common.exception;

import java.util.List;

public record ErrorResponse(
        String code,
        String message,
        List<FieldErrorItem> fieldErrors,
        String requestId
) {

    public record FieldErrorItem(
            String field,
            String message
    ) {
    }
}
