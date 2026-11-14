package com.do_an_tot_nghiep.k28.speaking.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.GiuCho;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.content.service.CardText;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.speaking.client.SpeechClient;
import com.do_an_tot_nghiep.k28.speaking.client.SpeechException;
import com.do_an_tot_nghiep.k28.speaking.client.SpeechResult;
import com.do_an_tot_nghiep.k28.speaking.config.SpeechProperties;
import com.do_an_tot_nghiep.k28.speaking.dto.ChiSoPhatAm;
import com.do_an_tot_nghiep.k28.speaking.dto.PronunciationHistoryItem;
import com.do_an_tot_nghiep.k28.speaking.dto.PronunciationHistoryQuery;
import com.do_an_tot_nghiep.k28.speaking.dto.PronunciationResponse;
import com.do_an_tot_nghiep.k28.speaking.dto.SoSanhPhatAm;
import com.do_an_tot_nghiep.k28.speaking.entity.KetQuaPhatAm;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.TrangThaiPhatAm;
import com.do_an_tot_nghiep.k28.speaking.repository.KetQuaPhatAmRepository;
import java.io.IOException;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class PronunciationService {

    private static final String WAV_MIME = "audio/wav";

    private final CardService cards;
    private final FileService files;
    private final StorageService storage;
    private final QuotaService quota;
    private final KetQuaPhatAmRepository results;
    private final SpeechClient client;
    private final SpeechProperties props;
    private final JsonMapper json;
    private final PlatformTransactionManager txManager;

    public PronunciationResponse assess(Long userId, Long cardId, MultipartFile file) {
        byte[] wav = read(file);
        String text = CardText.term(cards.audioSource(userId, cardId).tu());
        if (text == null || text.isEmpty() || text.length() > props.maxKyTu()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "theId",
                    "Từ của thẻ quá dài để đánh giá phát âm");
        }
        int thoiLuongMs = WavAudio.durationMs(wav);
        if (thoiLuongMs > props.maxGiay() * 1000) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "file",
                    "Bản ghi tối đa " + props.maxGiay() + " giây");
        }

        GiuCho giuCho = tx().execute(status -> quota.giuCho(userId, LoaiDichVu.PHAT_AM));
        long started = System.nanoTime();
        SpeechResult result;
        try {
            result = client.danhGia(wav, text);
        } catch (SpeechException e) {
            refund(userId, giuCho);
            log.warn("Pronunciation assessment failed: provider {} code {}", client.nhaCungCap(), e.getMaLoi());
            throw new ApiException(ErrorCode.SPEECH_UNAVAILABLE,
                    "Chưa đánh giá được phát âm, lượt đã được hoàn lại, hãy thử lại sau");
        } catch (RuntimeException e) {
            refund(userId, giuCho);
            throw e;
        }
        int xuLyMs = (int) Math.min(Integer.MAX_VALUE, (System.nanoTime() - started) / 1_000_000);
        ChiSoPhatAm chiSo = result.chiSo();
        String objectKey = storage.newObjectKey("recordings/" + userId);
        KetQuaPhatAm saved;
        try {
            storage.putVerified(objectKey, wav, WAV_MIME);
            saved = tx().execute(status -> {
                Long fileId = files.createRecording(userId, objectKey, WAV_MIME, wav);
                KetQuaPhatAm row = results.saveAndFlush(KetQuaPhatAm.builder()
                        .nguoiDungId(userId)
                        .theId(cardId)
                        .tepGhiAmId(fileId)
                        .vanBanMau(text)
                        .ngonNgu(props.ngonNgu())
                        .nhaCungCap(client.nhaCungCap())
                        .moPhong(result.moPhong())
                        .trangThai(trangThai(chiSo))
                        .chiSoJson(json.writeValueAsString(chiSo))
                        .thoiLuongGhiMs(thoiLuongMs)
                        .thoiGianXuLyMs(xuLyMs)
                        .build());
                quota.xacNhan(userId, giuCho);
                return row;
            });
        } catch (RuntimeException e) {
            refund(userId, giuCho);
            deleteObject(objectKey);
            throw e;
        }
        log.info("Pronunciation assessed: provider {} status {} audio ms {} ms {}",
                saved.getNhaCungCap(), saved.getTrangThai(), thoiLuongMs, xuLyMs);
        return toResponse(saved);
    }

    public PronunciationResponse get(Long userId, Long id) {
        return toResponse(results.findByIdAndNguoiDungId(id, userId).orElseThrow(this::notFound));
    }

    public PageResponse<PronunciationHistoryItem> history(Long userId, PronunciationHistoryQuery query) {
        return PageResponse.of(results.history(userId, query.cardId(), PageRequest.of(query.page(), query.size()))
                .map(this::toHistoryItem));
    }

    public void deleteRecording(Long userId, Long fileId) {
        tx().executeWithoutResult(status -> results.findByNguoiDungIdAndTepGhiAmId(userId, fileId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bản ghi âm"))
                .xoaGhiAm());
        files.delete(userId, fileId);
    }

    private PronunciationResponse toResponse(KetQuaPhatAm row) {
        ChiSoPhatAm chiSo = chiSo(row);
        FileResponse ghiAm = row.getTepGhiAmId() == null ? null
                : files.ownedFile(row.getNguoiDungId(), row.getTepGhiAmId()).orElse(null);
        SoSanhPhatAm soSanh = results.findFirstByNguoiDungIdAndTheIdAndIdLessThanOrderByIdDesc(
                        row.getNguoiDungId(), row.getTheId(), row.getId())
                .map(previous -> compare(row, chiSo, previous))
                .orElse(null);
        return new PronunciationResponse(
                String.valueOf(row.getId()),
                String.valueOf(row.getTheId()),
                row.getVanBanMau(),
                row.getNgonNgu(),
                row.getNhaCungCap(),
                row.isMoPhong(),
                row.getTrangThai(),
                chiSo,
                row.getThoiLuongGhiMs(),
                ghiAm,
                soSanh,
                row.getCreatedAt());
    }

    private PronunciationHistoryItem toHistoryItem(KetQuaPhatAm row) {
        ChiSoPhatAm chiSo = chiSo(row);
        return new PronunciationHistoryItem(
                String.valueOf(row.getId()),
                String.valueOf(row.getTheId()),
                row.getVanBanMau(),
                row.getNhaCungCap(),
                row.isMoPhong(),
                row.getTrangThai(),
                chiSo.tongDiem(),
                chiSo.doChinhXac(),
                chiSo.doTroiChay(),
                chiSo.doDayDu(),
                row.getTepGhiAmId() == null ? null : String.valueOf(row.getTepGhiAmId()),
                row.getCreatedAt());
    }

    private SoSanhPhatAm compare(KetQuaPhatAm row, ChiSoPhatAm current, KetQuaPhatAm previousRow) {
        boolean sameScale = row.getNhaCungCap().equals(previousRow.getNhaCungCap())
                && row.isMoPhong() == previousRow.isMoPhong();
        ChiSoPhatAm previous = chiSo(previousRow);
        return new SoSanhPhatAm(
                String.valueOf(previousRow.getId()),
                previousRow.getCreatedAt(),
                sameScale,
                delta(sameScale, current, previous, ChiSoPhatAm::tongDiem),
                delta(sameScale, current, previous, ChiSoPhatAm::doChinhXac),
                delta(sameScale, current, previous, ChiSoPhatAm::doTroiChay),
                delta(sameScale, current, previous, ChiSoPhatAm::doDayDu));
    }

    private static Double delta(boolean sameScale, ChiSoPhatAm current, ChiSoPhatAm previous,
                                Function<ChiSoPhatAm, Double> metric) {
        Double now = metric.apply(current);
        Double before = metric.apply(previous);
        if (!sameScale || now == null || before == null) {
            return null;
        }
        return Math.round((now - before) * 10) / 10.0;
    }

    private static TrangThaiPhatAm trangThai(ChiSoPhatAm chiSo) {
        if (chiSo.hasNoScore()) {
            return TrangThaiPhatAm.KHONG_NHAN_DIEN;
        }
        return chiSo.hasAllScores() ? TrangThaiPhatAm.DAY_DU : TrangThaiPhatAm.THIEU_CHI_SO;
    }

    private ChiSoPhatAm chiSo(KetQuaPhatAm row) {
        return json.readValue(row.getChiSoJson(), ChiSoPhatAm.class);
    }

    private byte[] read(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "file", "Chưa có bản ghi âm");
        }
        if (file.getSize() > props.maxBytes()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "file", "Bản ghi vượt dung lượng cho phép");
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "file", "Không đọc được bản ghi âm");
        }
    }

    private void refund(Long userId, GiuCho giuCho) {
        tx().executeWithoutResult(status -> quota.hoanTra(userId, giuCho));
    }

    private void deleteObject(String key) {
        try {
            storage.delete(key);
        } catch (ApiException e) {
            log.warn("Could not remove unused recording object");
        }
    }

    private ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy kết quả phát âm");
    }

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }
}
