package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.dto.UpdateDeckRequest;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateSampleDeckRequest(
        @Pattern(regexp = "(?Us).*\\S.*", message = "Tên bộ không được để trắng")
        @Size(max = 150, message = "Tên bộ tối đa 150 ký tự")
        String ten,

        @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
        String moTa,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID chủ đề không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID chủ đề không hợp lệ")
        String chuDeId,

        Boolean boChuDe,

        TrinhDo trinhDo,

        MucTieu mucTieu,

        QuyenTruyCap quyenTruyCap,

        TrangThaiKiemDuyet trangThaiKiemDuyet,

        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {

    public UpdateSampleDeckRequest {
        boChuDe = Boolean.TRUE.equals(boChuDe);
        lyDo = Reasons.normalize(lyDo);
    }

    @AssertTrue(message = "Không gửi chuDeId khi yêu cầu bỏ chủ đề")
    public boolean isTopicSelectionValid() {
        return !boChuDe || chuDeId == null;
    }

    public UpdateDeckRequest toDeckRequest() {
        return new UpdateDeckRequest(ten, moTa, chuDeId, boChuDe, trinhDo, quyenTruyCap, mucTieu, false, version);
    }
}
