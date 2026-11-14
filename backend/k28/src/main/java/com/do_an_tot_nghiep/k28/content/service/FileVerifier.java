package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.document.DocxTextReader;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequest;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FileVerifier {

    private static final Set<String> OOXML_CONTAINERS = Set.of("application/x-tika-ooxml", "application/zip");

    private final MediaValidator media;

    private final DocxTextReader docx;

    private final Tika tika = new Tika();

    public record VerifiedFile(
            String mimeType,
            long kichThuoc,
            String checksum
    ) {
    }

    public int maxBytes(LoaiTep loai) {
        return (int) loai.getGioiHan();
    }

    public String validateRequest(UploadRequest request) {
        if (request.kichThuoc() <= 0
                || request.kichThuoc() > maxBytes(request.loai())) {
            throw invalid("Dung lượng tệp không hợp lệ");
        }

        String mimeType = normalize(request.mimeType());
        requireAllowed(request.loai(), mimeType);
        return mimeType;
    }

    public VerifiedFile verify(TepTin file, byte[] content) {
        if (content.length == 0
                || content.length > maxBytes(file.getLoai())
                || content.length != file.getKichThuoc()) {
            throw invalid("Dung lượng thực tế không khớp yêu cầu tải lên");
        }

        String actualMime = detect(file.getLoai(), content);
        requireAllowed(file.getLoai(), actualMime);
        if (!actualMime.equals(normalize(file.getMimeType()))) {
            throw invalid("Định dạng thực tế không khớp MIME đã khai báo");
        }

        String actualChecksum = sha256(content);
        if (!actualChecksum.equalsIgnoreCase(file.getChecksum())) {
            throw invalid("Checksum không khớp; hãy tải lại tệp");
        }

        if (file.getLoai() == LoaiTep.TAI_LIEU) {
            try {
                docx.ensureReadable(content);
            } catch (DocxTextReader.UnreadableDocumentException e) {
                throw invalid("Tệp Word bị hỏng hoặc không đúng định dạng .docx");
            }
        } else {
            media.validate(content, actualMime);
        }

        return new VerifiedFile(actualMime, content.length, actualChecksum);
    }

    private String detect(LoaiTep loai, byte[] content) {
        String detected = normalize(tika.detect(content));
        if (loai == LoaiTep.TAI_LIEU && OOXML_CONTAINERS.contains(detected)) {
            return DocxTextReader.MIME_TYPE;
        }
        return detected;
    }

    private void requireAllowed(LoaiTep loai, String mimeType) {
        if (!loai.getMimeTypes().contains(mimeType)) {
            throw invalid("Định dạng tệp không được hỗ trợ");
        }
    }

    private String normalize(String mimeType) {
        return switch (mimeType.strip().toLowerCase(Locale.ROOT)) {
            case "image/jpg" -> "image/jpeg";
            case "audio/wav", "audio/wave", "audio/x-wav" -> "audio/vnd.wave";
            case "audio/flac" -> "audio/x-flac";
            default -> mimeType.strip().toLowerCase(Locale.ROOT);
        };
    }

    private String sha256(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private ApiException invalid(String message) {
        return new ApiException(ErrorCode.BUSINESS_RULE, message);
    }
}
