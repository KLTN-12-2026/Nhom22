package com.do_an_tot_nghiep.k28.speaking.client;

import com.do_an_tot_nghiep.k28.speaking.config.SpeechProperties;
import com.do_an_tot_nghiep.k28.speaking.dto.ChiSoPhatAm;
import com.do_an_tot_nghiep.k28.speaking.dto.ChiSoTu;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.LoiPhatAm;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.speech.provider", havingValue = "fake", matchIfMissing = true)
public class FakeSpeechClient implements SpeechClient {

    public enum CheDo {
        THANH_CONG, THIEU_CHI_SO, KHONG_NHAN_DIEN, LOI, TIMEOUT
    }

    private static final Pattern MARKER = Pattern.compile("#mo-phong:([A-Z_]+)");

    private final SpeechProperties props;

    public FakeSpeechClient(SpeechProperties props) {
        this.props = props;
    }

    @Override
    public String nhaCungCap() {
        return "fake";
    }

    @Override
    public SpeechResult danhGia(byte[] wav, String vanBanMau) {
        CheDo cheDo = cheDo(vanBanMau);
        pause(props.fake().doTre().toMillis());
        double diem = 60 + Math.floorMod(Arrays.hashCode(wav), 36);
        String tu = MARKER.matcher(vanBanMau).replaceAll("").strip();
        return switch (cheDo) {
            case LOI -> throw new SpeechException("MO_PHONG_LOI");
            case TIMEOUT -> throw new SpeechException("TIMEOUT");
            case KHONG_NHAN_DIEN -> new SpeechResult(ChiSoPhatAm.empty(), true);
            case THIEU_CHI_SO -> new SpeechResult(new ChiSoPhatAm(null, diem, null, 100.0, tu,
                    List.of(new ChiSoTu(tu, diem, LoiPhatAm.KHONG))), true);
            case THANH_CONG -> new SpeechResult(new ChiSoPhatAm(diem, diem, Math.min(100, diem + 4), 100.0, tu,
                    List.of(new ChiSoTu(tu, diem, diem < 70 ? LoiPhatAm.SAI : LoiPhatAm.KHONG))), true);
        };
    }

    private CheDo cheDo(String vanBanMau) {
        Matcher matcher = MARKER.matcher(vanBanMau);
        String value = matcher.find() ? matcher.group(1) : props.fake().cheDo();
        try {
            return CheDo.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            return CheDo.THANH_CONG;
        }
    }

    private void pause(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SpeechException("GIAN_DOAN");
        }
    }
}
