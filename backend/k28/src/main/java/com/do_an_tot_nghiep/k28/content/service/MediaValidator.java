package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import lombok.extern.slf4j.Slf4j;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioHeader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MediaValidator {

    @Value("${app.files.max-audio-seconds:300}")
    private int maxAudioSeconds = 300;

    @Value("${app.files.max-image-dimension:4096}")
    private int maxImageDimension = 4096;

    public void validate(byte[] content, String mimeType) {
        if (mimeType.startsWith("image/")) {
            validateImage(content);
        } else {
            validateAudio(content, mimeType);
        }
    }

    private void validateImage(byte[] content) {
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(content))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw invalid("Không thể đọc nội dung ảnh");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > maxImageDimension || height > maxImageDimension) {
                    throw invalid("Kích thước ảnh vượt giới hạn " + maxImageDimension + " pixel mỗi chiều");
                }
                if (reader.read(0) == null) {
                    throw invalid("Nội dung ảnh không hợp lệ");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException e) {
            throw invalid("Ảnh bị hỏng hoặc không thể giải mã");
        }
    }

    private void validateAudio(byte[] content, String mimeType) {
        String extension = switch (mimeType) {
            case "audio/mpeg" -> ".mp3";
            case "audio/vnd.wave" -> ".wav";
            case "audio/x-flac" -> ".flac";
            default -> throw invalid("Định dạng âm thanh không được hỗ trợ");
        };
        Path temp;
        try {
            temp = Files.createTempFile("vocab-audio-", extension);
        } catch (IOException e) {
            throw new ApiException(ErrorCode.DEPENDENCY_DOWN, "Không thể kiểm tra âm thanh lúc này");
        }
        try {
            Files.write(temp, content);
            AudioHeader header = AudioFileIO.read(temp.toFile()).getAudioHeader();
            double seconds = header.getPreciseTrackLength();
            if (!Double.isFinite(seconds) || seconds <= 0 || seconds > maxAudioSeconds
                    || header.getSampleRateAsNumber() <= 0) {
                throw invalid("Âm thanh phải có thời lượng lớn hơn 0 và tối đa " + maxAudioSeconds + " giây");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw invalid("Âm thanh bị hỏng hoặc không thể đọc thời lượng");
        } finally {
            try {
                Files.deleteIfExists(temp);
            } catch (IOException e) {
                log.warn("Could not remove temporary audio validation file");
            }
        }
    }

    private ApiException invalid(String message) {
        return new ApiException(ErrorCode.BUSINESS_RULE, message);
    }
}
