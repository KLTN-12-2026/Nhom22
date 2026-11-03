package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateCardRequest(
        @NotBlank(message = "Nhập từ hoặc cụm từ")
        @Size(max = 100, message = "Từ tối đa 100 ký tự")
        String tu,

        @Size(max = 30, message = "Từ loại tối đa 30 ký tự")
        String tuLoai,

        @NotBlank(message = "Nhập nghĩa tiếng Việt")
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

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID âm từ không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID âm từ không hợp lệ"
        )
        String amTuId,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID âm câu không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID âm câu không hợp lệ"
        )
        String amCauId
) {

    public CreateCardRequest {
        tu = CardText.term(tu);
        tuLoai = CardText.term(tuLoai);
        nghiaVi = CardText.text(nghiaVi);
        phienAm = CardText.text(phienAm);
        viDuEn = CardText.text(viDuEn);
        dichVi = CardText.text(dichVi);
        nguon = CardText.text(nguon);
        doKho = doKho == null ? 1 : doKho;
        nhanIds = nhanIds == null ? List.of() : nhanIds;
    }
}