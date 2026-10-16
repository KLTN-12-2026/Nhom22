package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

public record SrsState(
        TrangThaiTienDo trangThai,
        int buocHoc,
        BigDecimal ef,
        int khoangOnNgay,
        int chuoiThanhCong,
        int soLanQuen,
        Instant hanOnAt
) {

    public static final BigDecimal INITIAL_EF = new BigDecimal("2.50");
    public static final BigDecimal MIN_EF = new BigDecimal("1.30");
    public static final int MAX_INTERVAL_DAYS = 365;

    public SrsState {
        if (trangThai == null) {
            throw new IllegalArgumentException("Trạng thái tiến độ không được null");
        }
        ef = normalizeEf(ef);
        if (buocHoc < 0 || buocHoc > 1) {
            throw new IllegalArgumentException("Bước học phải là 0 hoặc 1");
        }
        if (khoangOnNgay < 0 || khoangOnNgay > MAX_INTERVAL_DAYS) {
            throw new IllegalArgumentException("Khoảng ôn phải từ 0 đến 365 ngày");
        }
        if (chuoiThanhCong < 0 || soLanQuen < 0) {
            throw new IllegalArgumentException("Chuỗi thành công và số lần quên không được âm");
        }
        validateProgress(trangThai, buocHoc, khoangOnNgay, chuoiThanhCong, hanOnAt);
    }

    public static SrsState newCard() {
        return new SrsState(TrangThaiTienDo.MOI, 0, INITIAL_EF, 0, 0, 0, null);
    }

    private static BigDecimal normalizeEf(BigDecimal ef) {
        if (ef == null || ef.compareTo(MIN_EF) < 0) {
            throw new IllegalArgumentException("Hệ số EF phải từ 1.30 trở lên");
        }
        try {
            return ef.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Hệ số EF chỉ được có tối đa hai chữ số thập phân", exception);
        }
    }

    private static void validateProgress(
            TrangThaiTienDo trangThai,
            int buocHoc,
            int khoangOnNgay,
            int chuoiThanhCong,
            Instant hanOnAt
    ) {
        switch (trangThai) {
            case MOI -> {
                if (buocHoc != 0 || khoangOnNgay != 0 || chuoiThanhCong != 0 || hanOnAt != null) {
                    throw new IllegalArgumentException("Thẻ mới phải có bước, khoảng ôn, chuỗi bằng 0 và chưa có hạn ôn");
                }
            }
            case DANG_HOC -> {
                if (khoangOnNgay != 0 || chuoiThanhCong != 0 || hanOnAt == null) {
                    throw new IllegalArgumentException("Thẻ đang học phải có hạn ôn, khoảng ôn và chuỗi bằng 0");
                }
            }
            case ON_TAP -> {
                if (buocHoc != 0 || khoangOnNgay < 1 || chuoiThanhCong < 1 || hanOnAt == null) {
                    throw new IllegalArgumentException("Thẻ ôn tập phải có bước 0, khoảng ôn và chuỗi dương, có hạn ôn");
                }
            }
            case HOC_LAI -> {
                if (buocHoc != 0 || khoangOnNgay != 0 || chuoiThanhCong != 0 || hanOnAt == null) {
                    throw new IllegalArgumentException("Thẻ học lại phải có hạn ôn, bước, khoảng ôn và chuỗi bằng 0");
                }
            }
            case TAM_NGUNG -> {
            }
        }
    }
}