package com.do_an_tot_nghiep.k28.speaking.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.GiuCho;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.CardAudioSource;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.content.service.CardText;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.speaking.client.TtsClient;
import com.do_an_tot_nghiep.k28.speaking.client.TtsException;
import com.do_an_tot_nghiep.k28.speaking.client.TtsResult;
import com.do_an_tot_nghiep.k28.speaking.config.TtsProperties;
import com.do_an_tot_nghiep.k28.speaking.dto.CardAudioResponse;
import com.do_an_tot_nghiep.k28.speaking.entity.AmThanhTts;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.LoaiAmThanh;
import com.do_an_tot_nghiep.k28.speaking.mapper.CardAudioMapper;
import com.do_an_tot_nghiep.k28.speaking.repository.AmThanhTtsRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class TtsService {

    public static final String NGUON_TAI_LEN = "TAI_LEN";
    public static final String NGUON_TTS = "TTS";

    private final CardService cards;
    private final FileService files;
    private final StorageService storage;
    private final QuotaService quota;
    private final AmThanhTtsRepository cache;
    private final TtsClient client;
    private final TtsProperties props;
    private final CardAudioMapper mapper;
    private final PlatformTransactionManager txManager;

    private record Audio(FileResponse file, String nguon, boolean moPhong) {
    }

    public CardAudioResponse cardAudio(Long userId, Long cardId, LoaiAmThanh loai) {
        Audio audio = audio(userId, cardId, loai);
        return mapper.toResponse(audio.file(), audio.nguon(), audio.moPhong());
    }

    public FileResponse wordAudio(Long userId, Long cardId) {
        return audio(userId, cardId, LoaiAmThanh.TU).file();
    }

    private Audio audio(Long userId, Long cardId, LoaiAmThanh loai) {
        CardAudioSource card = cards.audioSource(userId, cardId);
        Long uploaded = loai == LoaiAmThanh.TU ? card.amTuId() : card.amCauId();
        if (uploaded != null) {
            return new Audio(files.linkedFile(uploaded), NGUON_TAI_LEN, false);
        }
        String text = CardText.term(loai == LoaiAmThanh.TU ? card.tu() : card.viDuEn());
        if (text == null || text.isEmpty()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Thẻ chưa có câu ví dụ để đọc");
        }
        if (text.length() > props.maxKyTu()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Nội dung quá dài để tạo giọng đọc");
        }
        String key = cacheKey(text);
        return cache.findByKhoaCache(key)
                .map(this::cached)
                .orElseGet(() -> generate(userId, text, key));
    }

    private Audio generate(Long userId, String text, String key) {
        GiuCho giuCho = tx().execute(status -> quota.giuCho(userId, LoaiDichVu.TTS));
        long started = System.nanoTime();
        TtsResult result;
        try {
            result = client.docVanBan(text);
        } catch (TtsException e) {
            refund(userId, giuCho);
            log.warn("TTS failed: provider {} code {}", client.nhaCungCap(), e.getMaLoi());
            throw new ApiException(ErrorCode.TTS_UNAVAILABLE,
                    "Chưa tạo được giọng đọc mẫu, hãy dùng giọng đọc của trình duyệt");
        } catch (RuntimeException e) {
            refund(userId, giuCho);
            throw e;
        }
        int thoiLuongMs = (int) Math.min(Integer.MAX_VALUE, (System.nanoTime() - started) / 1_000_000);
        String objectKey = storage.newObjectKey("tts");
        try {
            storage.putVerified(objectKey, result.noiDung(), result.mimeType());
            AmThanhTts saved = tx().execute(status -> {
                Long fileId = files.createSystemAudio(objectKey, result.mimeType(), result.noiDung());
                AmThanhTts row = cache.saveAndFlush(AmThanhTts.builder()
                        .khoaCache(key)
                        .tepTinId(fileId)
                        .nhaCungCap(client.nhaCungCap())
                        .model(client.model())
                        .giong(client.giong())
                        .ngonNgu(props.ngonNgu())
                        .phienBan(props.phienBan())
                        .doDaiVanBan(text.length())
                        .thoiLuongMs(thoiLuongMs)
                        .moPhong(result.moPhong())
                        .build());
                quota.xacNhan(userId, giuCho);
                return row;
            });
            log.info("TTS generated: provider {} model {} voice {} chars {} ms {}",
                    saved.getNhaCungCap(), saved.getModel(), saved.getGiong(), saved.getDoDaiVanBan(), thoiLuongMs);
            return cached(saved);
        } catch (DataIntegrityViolationException e) {
            refund(userId, giuCho);
            deleteObject(objectKey);
            return cache.findByKhoaCache(key).map(this::cached).orElseThrow(() -> e);
        } catch (RuntimeException e) {
            refund(userId, giuCho);
            deleteObject(objectKey);
            throw e;
        }
    }

    private Audio cached(AmThanhTts row) {
        return new Audio(files.linkedFile(row.getTepTinId()), NGUON_TTS, row.isMoPhong());
    }

    String cacheKey(String text) {
        String source = String.join("\n", client.nhaCungCap(), client.model(), client.giong(),
                props.ngonNgu(), props.phienBan(), text);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(source.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private void refund(Long userId, GiuCho giuCho) {
        tx().executeWithoutResult(status -> quota.hoanTra(userId, giuCho));
    }

    private void deleteObject(String key) {
        try {
            storage.delete(key);
        } catch (ApiException e) {
            log.warn("Could not remove unused TTS object");
        }
    }

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }
}
