package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.mapper.FileMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.LibraryDeckSpecifications;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class LibraryMediaService {

    private final BoTheRepository decks;
    private final TheTuVungRepository cards;
    private final CardLinkRepository links;
    private final TepTinRepository files;
    private final StorageService storage;
    private final FileMapper mapper;
    private final PlatformTransactionManager txManager;

    public FileResponse get(Long deckId, Long cardId, VaiTroTep role) {
        requirePositiveId(deckId, "id");
        requirePositiveId(cardId, "cardId");
        if (role == null) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "role",
                    "Vai trò tệp phải là ANH, AM_TU hoặc AM_CAU"
            );
        }

        TransactionTemplate transaction = new TransactionTemplate(txManager);
        transaction.setReadOnly(true);
        TepTin file = transaction.execute(status -> {
            if (!decks.exists(LibraryDeckSpecifications.visibleById(deckId))) {
                throw notFound();
            }

            cards.findByIdAndXoaAtIsNull(cardId)
                    .filter(card -> deckId.equals(card.getBoTheId()))
                    .orElseThrow(this::notFound);

            Long fileId = links.findFiles(List.of(cardId)).stream()
                    .filter(link -> link.vaiTro() == role)
                    .map(CardLinkRepository.FileLink::tepId)
                    .findFirst()
                    .orElseThrow(this::notFound);

            LoaiTep expectedType = role == VaiTroTep.ANH
                    ? LoaiTep.ANH
                    : LoaiTep.AM_THANH;

            return files.findById(fileId)
                    .filter(candidate -> candidate.getHoanTatAt() != null)
                    .filter(candidate -> candidate.getTrangThaiXoa()
                            == TrangThaiXoaTep.CON_HIEU_LUC)
                    .filter(candidate -> candidate.getXoaAt() == null)
                    .filter(candidate -> candidate.getLoai() == expectedType)
                    .orElseThrow(this::notFound);
        });

        StorageService.PresignedUrl signed = storage.presignGet(file.getObjectKey());
        return mapper.toResponse(file, signed.url(), signed.expiresAt());
    }

    private void requirePositiveId(Long id, String field) {
        if (id == null || id <= 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    field,
                    "ID phải là số nguyên dương"
            );
        }
    }

    private ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy tệp công khai");
    }
}
