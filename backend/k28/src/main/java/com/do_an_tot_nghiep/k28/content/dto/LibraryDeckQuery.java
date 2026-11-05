package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguonBo;
import jakarta.validation.constraints.*;

import java.text.Normalizer;

public record LibraryDeckQuery(
        @Size(max = 150, message = "Từ khóa tối đa 150 ký tự")
        String q,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID chủ đề không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID chủ đề không hợp lệ"
        )
        String chuDeId,

        TrinhDo trinhDo,

        MucTieu mucTieu,

        NguonBo nguon,

        @Pattern(
                regexp = "updated|name|size",
                message = "Sắp xếp phải là updated, name hoặc size"
        )
        String sort,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {
        public LibraryDeckQuery {
                q = nullableText(q);
                chuDeId = nullableText(chuDeId);
                sort = nullableText(sort);
                sort = sort == null ? "updated" : sort;
                page = page == null ? 0 : page;
                size = size == null ? 20 : size;
        }

        public Long topicId() {
                return chuDeId == null ? null : Long.valueOf(chuDeId);
        }

        @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
        public boolean isOffsetValid() {
                return (long) page * size <= Integer.MAX_VALUE;
        }

        private static String nullableText(String value) {
                if (value == null || value.isBlank()) {
                        return null;
                }

                return Normalizer.normalize(
                        value.strip(),
                        Normalizer.Form.NFC
                );
        }
}