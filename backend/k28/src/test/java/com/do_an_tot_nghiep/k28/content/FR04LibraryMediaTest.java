package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.mapper.FileMapper;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.content.service.LibraryMediaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FR04LibraryMediaTest {

    private static final Instant NOW = Instant.parse("2026-10-08T14:00:00Z");

    @Mock private BoTheRepository decks;
    @Mock private TheTuVungRepository cards;
    @Mock private CardLinkRepository links;
    @Mock private TepTinRepository files;
    @Mock private StorageService storage;
    @Mock private FileMapper mapper;
    @Mock private PlatformTransactionManager txManager;
    @Mock private TransactionStatus status;
    @InjectMocks private LibraryMediaService service;

    @BeforeEach
    void transaction() {
        when(txManager.getTransaction(any(TransactionDefinition.class)))
                .thenAnswer(invocation -> {
                    TransactionDefinition definition = invocation.getArgument(0);
                    assertThat(definition.isReadOnly()).isTrue();
                    return status;
                });
    }

    @ParameterizedTest
    @EnumSource(VaiTroTep.class)
    void tc03_signsLinkedMediaAfterReadTransaction(VaiTroTep role) {
        allowCard(2L);
        linkedFile(role);
        TepTin file = completed(role == VaiTroTep.ANH ? LoaiTep.ANH : LoaiTep.AM_THANH);
        when(files.findById(8L)).thenReturn(Optional.of(file));
        StorageService.PresignedUrl signed = new StorageService.PresignedUrl(
                "https://storage.example/test", NOW.plusSeconds(300)
        );
        when(storage.presignGet("files/test")).thenReturn(signed);
        FileResponse response = new FileResponse(
                "8", file.getLoai().name(), file.getMimeType(), 20L,
                "checksum", NOW, signed.url(), signed.expiresAt()
        );
        when(mapper.toResponse(file, signed.url(), signed.expiresAt())).thenReturn(response);

        assertThat(service.get(2L, 5L, role)).isSameAs(response);
        var order = inOrder(txManager, storage);
        order.verify(txManager).commit(status);
        order.verify(storage).presignGet("files/test");
    }

    @Test
    void tc03_inaccessibleDeckDoesNotSignOrReadCards() {
        when(decks.exists(anyDeck())).thenReturn(false);

        assertNotFound();
        verifyNoInteractions(cards, links, files);
    }

    @Test
    void tc03_missingOrDeletedCardDoesNotSign() {
        when(decks.exists(anyDeck())).thenReturn(true);
        when(cards.findByIdAndXoaAtIsNull(5L)).thenReturn(Optional.empty());

        assertNotFound();
        verifyNoInteractions(links, files);
    }

    @Test
    void tc03_cardFromAnotherDeckDoesNotSign() {
        allowCard(3L);

        assertNotFound();
        verifyNoInteractions(links, files);
    }

    @Test
    void tc03_unlinkedRoleDoesNotSign() {
        allowCard(2L);
        linkedFile(VaiTroTep.AM_TU);

        assertNotFound();
        verifyNoInteractions(files);
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing", "pending", "deleted", "wrongType"})
    void tc03_unavailableFileDoesNotSign(String state) {
        allowCard(2L);
        linkedFile(VaiTroTep.ANH);
        TepTin file = switch (state) {
            case "missing" -> null;
            case "pending" -> TepTin.pending(99L, "pending/test", "image/png", 20L, "checksum", LoaiTep.ANH);
            case "deleted" -> {
                TepTin deleted = completed(LoaiTep.ANH);
                deleted.markDeleted(NOW);
                yield deleted;
            }
            default -> completed(LoaiTep.AM_THANH);
        };
        when(files.findById(8L)).thenReturn(Optional.ofNullable(file));

        assertNotFound();
    }

    private void allowCard(Long deckId) {
        when(decks.exists(anyDeck())).thenReturn(true);
        TheTuVung card = mock(TheTuVung.class);
        when(card.getBoTheId()).thenReturn(deckId);
        when(cards.findByIdAndXoaAtIsNull(5L)).thenReturn(Optional.of(card));
    }

    private void linkedFile(VaiTroTep role) {
        when(links.findFiles(List.of(5L))).thenReturn(List.of(
                new CardLinkRepository.FileLink(5L, 8L, role)
        ));
    }

    private TepTin completed(LoaiTep type) {
        String mime = type == LoaiTep.ANH ? "image/png" : "audio/mpeg";
        TepTin file = TepTin.pending(99L, "pending/test", mime, 20L, "checksum", type);
        file.complete("files/test", mime, 20L, "checksum", NOW);
        return file;
    }

    private Specification<BoThe> anyDeck() {
        return any();
    }

    private void assertNotFound() {
        assertThatThrownBy(() -> service.get(2L, 5L, VaiTroTep.ANH))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        verifyNoInteractions(storage, mapper);
    }
}
