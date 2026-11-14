package com.do_an_tot_nghiep.k28.content.entity.enums;

import com.do_an_tot_nghiep.k28.common.document.DocxTextReader;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LoaiTep {

    ANH(2L * 1024 * 1024, Set.of("image/jpeg", "image/png", "image/webp"), "Ảnh tối đa 2 MB"),
    AM_THANH(5L * 1024 * 1024, Set.of("audio/mpeg", "audio/vnd.wave", "audio/x-flac", "audio/wav", "audio/flac"),
            "Âm thanh tối đa 5 MB"),
    TAI_LIEU(1024L * 1024, Set.of(DocxTextReader.MIME_TYPE), "Tài liệu Word (.docx) tối đa 1 MB");

    private final long gioiHan;
    private final Set<String> mimeTypes;
    private final String thongBaoGioiHan;

    public static Optional<LoaiTep> of(String mimeType) {
        return Arrays.stream(values()).filter(l -> l.mimeTypes.contains(mimeType)).findFirst();
    }
}
