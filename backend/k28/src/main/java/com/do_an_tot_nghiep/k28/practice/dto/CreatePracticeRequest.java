package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreatePracticeRequest(

        @NotNull(message = "Chọn dạng bài")
        @Pattern(
                regexp = "CHON_NGHIA|CHON_TU|GHEP_TU|DIEN_CHO_TRONG|NHAP_TU_THEO_NGHIA|NGHE_VIET|PHAN_BIET_CAP|TONG_HOP",
                message = "Chọn dạng bài")
        String loaiBai,

        @NotNull(message = "Chọn 5, 10 hoặc 20 câu")
        Integer soCau,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId,

        @Pattern(regexp = "BO_THE|SO_TAY", message = "Nguồn phải là BO_THE hoặc SO_TAY")
        String nguon,

        @Size(max = 20, message = "Chọn tối đa 20 thẻ")
        List<@NotNull(message = "ID thẻ không hợp lệ")
             @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID thẻ không hợp lệ")
             @DecimalMax(value = "9223372036854775807", message = "ID thẻ không hợp lệ") String> theIds
) {

    public LoaiBai type() {
        return LoaiBai.valueOf(loaiBai);
    }

    public NguonBaiLuyen source() {
        return nguon == null ? NguonBaiLuyen.BO_THE : NguonBaiLuyen.valueOf(nguon);
    }

    public Long deckId() {
        return boTheId == null ? null : Long.valueOf(boTheId);
    }

    public List<Long> cardIds() {
        return theIds == null ? List.of() : theIds.stream().map(Long::valueOf).distinct().toList();
    }
}
