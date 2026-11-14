package com.do_an_tot_nghiep.k28.speaking.client;

import com.do_an_tot_nghiep.k28.speaking.config.TtsProperties;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.tts.provider", havingValue = "fake", matchIfMissing = true)
public class FakeTtsClient implements TtsClient {

    public enum CheDo {
        THANH_CONG, LOI, TIMEOUT, SAI_DINH_DANG, CHAM
    }

    public static final String MODEL = "fake-tts";
    public static final String MIME_TYPE = "audio/vnd.wave";

    private static final Pattern MARKER = Pattern.compile("#mo-phong:([A-Z_]+)");
    private static final int SAMPLE_RATE = 8000;
    private static final int SAMPLES = 2400;

    private final TtsProperties props;

    public FakeTtsClient(TtsProperties props) {
        this.props = props;
    }

    @Override
    public String nhaCungCap() {
        return "fake";
    }

    @Override
    public String model() {
        return MODEL;
    }

    @Override
    public String giong() {
        return props.giong();
    }

    @Override
    public TtsResult docVanBan(String vanBan) {
        CheDo cheDo = cheDo(vanBan);
        pause(cheDo == CheDo.CHAM ? 400 : props.fake().doTre().toMillis());
        return switch (cheDo) {
            case LOI -> throw new TtsException("MO_PHONG_LOI");
            case TIMEOUT -> throw new TtsException("TIMEOUT");
            case SAI_DINH_DANG -> throw new TtsException("SAI_DINH_DANG");
            case THANH_CONG, CHAM -> new TtsResult(wav(vanBan.length()), MIME_TYPE, true);
        };
    }

    public CheDo cheDo(String vanBan) {
        Matcher matcher = MARKER.matcher(vanBan);
        String value = matcher.find() ? matcher.group(1) : props.fake().cheDo();
        try {
            return CheDo.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            return CheDo.THANH_CONG;
        }
    }

    private byte[] wav(int seed) {
        int dataBytes = SAMPLES * 2;
        ByteBuffer buffer = ByteBuffer.allocate(44 + dataBytes).order(ByteOrder.LITTLE_ENDIAN);
        buffer.put("RIFF".getBytes()).putInt(36 + dataBytes).put("WAVE".getBytes());
        buffer.put("fmt ".getBytes()).putInt(16).putShort((short) 1).putShort((short) 1)
                .putInt(SAMPLE_RATE).putInt(SAMPLE_RATE * 2).putShort((short) 2).putShort((short) 16);
        buffer.put("data".getBytes()).putInt(dataBytes);
        double frequency = 330 + (seed % 20) * 10;
        for (int i = 0; i < SAMPLES; i++) {
            buffer.putShort((short) (Math.sin(2 * Math.PI * frequency * i / SAMPLE_RATE) * 6000));
        }
        return buffer.array();
    }

    private void pause(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TtsException("GIAN_DOAN");
        }
    }
}
