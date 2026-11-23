package com.do_an_tot_nghiep.k28.account.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.do_an_tot_nghiep.k28.account.entity.GiaoDien;
import com.do_an_tot_nghiep.k28.account.entity.LichLeGiaoDien;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ThemeLockRuleTest {

    private static final LocalDate HOM_NAY = LocalDate.of(2026, 11, 23);

    private static GiaoDien theme(String goi) {
        GiaoDien theme = mock(GiaoDien.class);
        when(theme.getGoiToiThieu()).thenReturn(goi);
        return theme;
    }

    @Test
    void freeUsesFreeTheme() {
        assertThat(ThemeService.lockReason(theme("FREE"), "FREE", null, HOM_NAY)).isNull();
    }

    @Test
    void freeCannotUseProTheme() {
        assertThat(ThemeService.lockReason(theme("PRO"), "FREE", null, HOM_NAY)).isEqualTo("Cần gói Pro");
    }

    @Test
    void proCannotUsePremiumTheme() {
        assertThat(ThemeService.lockReason(theme("PREMIUM"), "PRO", null, HOM_NAY)).isEqualTo("Cần gói Premium");
    }

    @Test
    void premiumUsesEveryTheme() {
        LichLeGiaoDien later = LichLeGiaoDien.of("TET", LocalDate.of(2027, 2, 6), 10, 3);
        assertThat(ThemeService.lockReason(theme("PREMIUM"), "PREMIUM", later, HOM_NAY)).isNull();
        assertThat(ThemeService.lockReason(theme("PRO"), "PREMIUM", null, HOM_NAY)).isNull();
    }

    @Test
    void festivalOpensForEveryoneInsideWindow() {
        LichLeGiaoDien nhaGiao = LichLeGiaoDien.of("NHA_GIAO", LocalDate.of(2026, 11, 20), 10, 3);
        assertThat(ThemeService.lockReason(theme("PREMIUM"), "FREE", nhaGiao, HOM_NAY)).isNull();
        assertThat(ThemeService.lockReason(theme("PREMIUM"), "FREE", nhaGiao, LocalDate.of(2026, 11, 10))).isNull();
    }

    @Test
    void festivalClosedOutsideWindowTellsOpeningDay() {
        LichLeGiaoDien noel = LichLeGiaoDien.of("NOEL", LocalDate.of(2026, 12, 25), 10, 3);
        assertThat(ThemeService.lockReason(theme("PREMIUM"), "FREE", noel, HOM_NAY))
                .isEqualTo("Mở cho mọi người từ 15/12, hoặc dùng ngay với gói Premium");
        assertThat(noel.dangMo(LocalDate.of(2026, 12, 28))).isTrue();
        assertThat(noel.dangMo(LocalDate.of(2026, 12, 29))).isFalse();
    }
}
