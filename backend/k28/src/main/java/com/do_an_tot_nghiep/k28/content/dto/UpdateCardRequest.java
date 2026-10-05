package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateCardRequest(
        @Pattern(
                regexp = "(?Us).*\\S.*",
                message = "Từ không được để trắng"
        )
        @Size(max = 100, message = "Từ tối đa 100 ký tự")
        String tu,

        @Size(max = 30, message = "Từ loại tối đa 30 ký tự")
        String tuLoai,

        @Pattern(
                regexp = "(?Us).*\\S.*",
                message = "Nghĩa không được để trắng"
        )
        @Size(max = 500, message = "Nghĩa tối đa 500 ký tự")
        String nghiaVi,

        @Size(max = 100, message = "Phiên âm tối đa 100 ký tự")
        String phienAm,

        @Size(max = 300, message = "Ví dụ tối đa 300 ký tự")
        String viDuEn,

        @Size(max = 300, message = "Bản dịch tối đa 300 ký tự")
        String dichVi,

        @Min(value = 1, message = "Độ khó từ 1 đến 5")
        @Max(value = 5, message = "Độ khó từ 1 đến 5")
        Integer doKho,

        @Size(max = 500, message = "Nguồn tối đa 500 ký tự")
        String nguon,

        @Size(max = 100, message = "Chọn tối đa 100 nhãn")
        List<
                @NotNull(message = "ID nhãn không được null")
                @Pattern(
                        regexp = "[1-9][0-9]{0,18}",
                        message = "ID nhãn không hợp lệ"
                )
                @DecimalMax(
                        value = "9223372036854775807",
                        message = "ID nhãn không hợp lệ"
                )
                        String
                > nhanIds,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID ảnh không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID ảnh không hợp lệ"
        )
        String anhId,

        Boolean boAnh,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID âm từ không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID âm từ không hợp lệ"
        )
        String amTuId,

        Boolean boAmTu,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID âm câu không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID âm câu không hợp lệ"
        )
        String amCauId,

        Boolean boAmCau,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {

    public UpdateCardRequest {
        tu = CardText.term(tu);
        tuLoai = CardText.term(tuLoai);
        nghiaVi = CardText.text(nghiaVi);
        phienAm = CardText.text(phienAm);
        viDuEn = CardText.text(viDuEn);
        dichVi = CardText.text(dichVi);
        nguon = CardText.text(nguon);
        boAnh = Boolean.TRUE.equals(boAnh);
        boAmTu = Boolean.TRUE.equals(boAmTu);
        boAmCau = Boolean.TRUE.equals(boAmCau);
    }

    @AssertTrue(message = "Không gửi anhId khi yêu cầu bỏ ảnh")
    public boolean isImageSelectionValid() {
        return !boAnh || anhId == null;
    }

    @AssertTrue(message = "Không gửi amTuId khi yêu cầu bỏ âm từ")
    public boolean isWordAudioSelectionValid() {
        return !boAmTu || amTuId == null;
    }

    @AssertTrue(message = "Không gửi amCauId khi yêu cầu bỏ âm câu")
    public boolean isSentenceAudioSelectionValid() {
        return !boAmCau || amCauId == null;
    }
}