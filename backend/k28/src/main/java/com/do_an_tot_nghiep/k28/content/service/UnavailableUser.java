package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.util.Map;

public final class UnavailableUser {

    public static final String LY_DO = "NGUOI_DUNG_KHONG_KHA_DUNG";

    private UnavailableUser() {
    }

    public static ApiException error() {
        return new ApiException(ErrorCode.NOT_FOUND, "Người dùng không khả dụng", Map.of("lyDo", LY_DO));
    }
}
