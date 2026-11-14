package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CardDraftEdit(
        @NotNull(message = "Thiếu ID thẻ nháp cần sửa")
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID thẻ nháp không hợp lệ")
        String banNhapId,

        @NotBlank(message = "Nhập từ tiếng Anh")
        @Size(max = 100, message = "Từ tối đa 100 ký tự")
        String tu,

        @Size(max = 30, message = "Từ loại tối đa 30 ký tự")
        String tuLoai,

        @NotBlank(message = "Nhập nghĩa tiếng Việt")
        @Size(max = 500, message = "Nghĩa tối đa 500 ký tự")
        String nghiaVi,

        @Size(max = 300, message = "Ví dụ tối đa 300 ký tự")
        String viDuEn,

        @Size(max = 300, message = "Bản dịch tối đa 300 ký tự")
        String dichVi
) {
    public CardDraftEdit {
        tu = CardText.term(tu);
        tuLoai = CardText.nullable(CardText.term(tuLoai));
        nghiaVi = CardText.term(nghiaVi);
        viDuEn = CardText.nullable(CardText.term(viDuEn));
        dichVi = CardText.nullable(CardText.term(dichVi));
    }
}
