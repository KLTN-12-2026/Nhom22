package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.content.service.MediaValidator;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class FR03MediaTest {

    private final MediaValidator validator = new MediaValidator();

    @Test
    void validPngAndJpegCanBeDecoded() throws Exception {
        validator.validate(FileFixtures.image("png"), "image/png");
        validator.validate(FileFixtures.image("jpg"), "image/jpeg");
    }

    @Test
    void validWebpCanBeDecoded() {
        byte[] webp = Base64.getDecoder().decode("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA");
        validator.validate(webp, "image/webp");
    }

    @Test
    void damagedImageIsRejected() {
        assertThatThrownBy(() -> validator.validate(new byte[]{1, 2, 3}, "image/png"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void oversizedImageDimensionsAreRejected() throws Exception {
        var image = new java.awt.image.BufferedImage(4097, 1, java.awt.image.BufferedImage.TYPE_INT_RGB);
        var output = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image, "png", output);
        assertThatThrownBy(() -> validator.validate(output.toByteArray(), "image/png"))
                .isInstanceOf(ApiException.class).hasMessageContaining("4096");
    }

    @Test
    void validWavDurationIsAccepted() {
        validator.validate(FileFixtures.wav(1), "audio/vnd.wave");
        validator.validate(FileFixtures.wav(300), "audio/vnd.wave");
    }

    @Test
    void excessiveDurationIsRejected() {
        assertThatThrownBy(() -> validator.validate(FileFixtures.wav(301), "audio/vnd.wave"))
                .isInstanceOf(ApiException.class).hasMessageContaining("300");
    }

    @Test
    void damagedMp3AndFlacAreRejected() {
        assertThatThrownBy(() -> validator.validate(new byte[]{'I', 'D', '3'}, "audio/mpeg"))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> validator.validate(new byte[]{'f', 'L', 'a', 'C'}, "audio/x-flac"))
                .isInstanceOf(ApiException.class);
    }
}
