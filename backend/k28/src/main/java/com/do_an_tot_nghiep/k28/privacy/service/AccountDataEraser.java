package com.do_an_tot_nghiep.k28.privacy.service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AccountDataEraser {

    static final String TEN_AN_DANH = "Người dùng đã xóa";
    private static final int CHUNK = 500;

    private final NamedParameterJdbcTemplate jdbc;

    @Transactional(propagation = Propagation.MANDATORY)
    public Map<String, Object> erase(Long userId, Instant now) {
        Map<String, Object> ketQua = new LinkedHashMap<>();
        MapSqlParameterSource u = new MapSqlParameterSource("u", userId).addValue("now", Timestamp.from(now))
                .addValue("ten", TEN_AN_DANH);

        List<Long> decks = jdbc.queryForList("""
                SELECT id FROM bo_the
                WHERE chu_so_huu_id = :u AND NOT (quyen_truy_cap = 'CONG_KHAI' AND xoa_at IS NULL)
                """, u, Long.class);
        List<Long> cards = ids("SELECT id FROM the_tu_vung WHERE bo_the_id IN (:ids)", decks);
        ketQua.put("boTheGiuLai", jdbc.queryForObject("""
                SELECT COUNT(*) FROM bo_the
                WHERE chu_so_huu_id = :u AND quyen_truy_cap = 'CONG_KHAI' AND xoa_at IS NULL
                """, u, Long.class));

        run(u, """
                DELETE r FROM tra_loi_bai_luyen r JOIN lan_lam_bai l ON l.id = r.lan_lam_id WHERE l.nguoi_dung_id = :u
                """);
        run(u, """
                DELETE r FROM tra_loi_bai_luyen r JOIN cau_hoi_bai_luyen c ON c.id = r.cau_hoi_id
                JOIN bai_luyen b ON b.id = c.bai_id WHERE b.nguoi_dung_id = :u
                """);
        run(u, "DELETE l FROM lan_lam_bai l JOIN bai_luyen b ON b.id = l.bai_id WHERE b.nguoi_dung_id = :u");
        run(u, "DELETE FROM lan_lam_bai WHERE nguoi_dung_id = :u");
        run(u, "DELETE c FROM cau_hoi_bai_luyen c JOIN bai_luyen b ON b.id = c.bai_id WHERE b.nguoi_dung_id = :u");
        run(u, "UPDATE bai_luyen SET bai_goc_id = NULL WHERE nguoi_dung_id = :u");
        ketQua.put("baiLuyen", run(u, "DELETE FROM bai_luyen WHERE nguoi_dung_id = :u"));

        run(u, "DELETE FROM lich_su_on WHERE nguoi_dung_id = :u");
        run(u, "DELETE pt FROM phien_hoc_the pt JOIN phien_hoc p ON p.id = pt.phien_id WHERE p.nguoi_dung_id = :u");
        run(u, "DELETE FROM phien_hoc WHERE nguoi_dung_id = :u");
        ketQua.put("tienDoThe", run(u, "DELETE FROM tien_do_the WHERE nguoi_dung_id = :u"));
        run(u, "DELETE FROM su_dung_hoc_ngay WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM loi_hoc_tap WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM so_tay_tu_kho WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM cap_tu_de_nham WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM so_diem_thuong WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM nguoi_dung_huy_hieu WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM tien_do_thu_thach WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM thong_bao WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM su_dung_dich_vu WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM bo_yeu_thich WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM chu_de_yeu_thich WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM yeu_cau_sao_chep_bo WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM yeu_cau_nhap_csv WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM yeu_cau_luu_the_ai WHERE nguoi_dung_id = :u");
        run(u, "DELETE n FROM ban_nhap_the_ai n JOIN yeu_cau_ai y ON y.id = n.yeu_cau_id WHERE y.nguoi_dung_id = :u");
        ketQua.put("yeuCauAi", run(u, "DELETE FROM yeu_cau_ai WHERE nguoi_dung_id = :u"));
        ketQua.put("ketQuaPhatAm", run(u, "DELETE FROM ket_qua_phat_am WHERE nguoi_dung_id = :u"));
        run(u, "DELETE FROM token_tai_khoan WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM danh_tinh_oauth WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM ho_so_hoc_tap WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM cai_dat_thong_bao WHERE nguoi_dung_id = :u");
        run(u, "DELETE FROM nguoi_dung_vai_tro WHERE nguoi_dung_id = :u");

        update("""
                DELETE l FROM lich_su_on l JOIN tien_do_the t ON t.id = l.tien_do_id WHERE t.the_id IN (:ids)
                """, cards);
        update("DELETE FROM tien_do_the WHERE the_id IN (:ids)", cards);
        update("DELETE FROM phien_hoc_the WHERE the_id IN (:ids)", cards);
        update("""
                DELETE r FROM tra_loi_bai_luyen r JOIN cau_hoi_bai_luyen c ON c.id = r.cau_hoi_id WHERE c.the_id IN (:ids)
                """, cards);
        update("DELETE FROM cau_hoi_bai_luyen WHERE the_id IN (:ids)", cards);
        update("DELETE FROM loi_hoc_tap WHERE the_id IN (:ids)", cards);
        update("DELETE FROM so_tay_tu_kho WHERE the_id IN (:ids)", cards);
        update("DELETE FROM cap_tu_de_nham WHERE the_1_id IN (:ids) OR the_2_id IN (:ids)", cards);
        update("DELETE FROM ket_qua_phat_am WHERE the_id IN (:ids)", cards);
        update("UPDATE ban_nhap_the_ai SET the_da_luu_id = NULL WHERE the_da_luu_id IN (:ids)", cards);
        update("DELETE FROM the_nhan WHERE the_id IN (:ids)", cards);
        update("DELETE FROM the_tep WHERE the_id IN (:ids)", cards);
        ketQua.put("theDaXoa", update("DELETE FROM the_tu_vung WHERE id IN (:ids)", cards));

        update("UPDATE bo_the SET bo_nguon_id = NULL WHERE bo_nguon_id IN (:ids)", decks);
        update("DELETE FROM yeu_cau_sao_chep_bo WHERE bo_nguon_id IN (:ids) OR bo_ket_qua_id IN (:ids)", decks);
        update("DELETE FROM bo_yeu_thich WHERE bo_the_id IN (:ids)", decks);
        ketQua.put("boTheDaXoa", update("DELETE FROM bo_the WHERE id IN (:ids)", decks));

        List<Long> files = jdbc.queryForList("""
                SELECT f.id FROM tep_tin f
                WHERE f.chu_so_huu_id = :u AND f.trang_thai_xoa = 'CON_HIEU_LUC'
                  AND NOT EXISTS (
                      SELECT 1 FROM the_tep tt JOIN the_tu_vung t ON t.id = tt.the_id
                      JOIN bo_the b ON b.id = t.bo_the_id
                      WHERE tt.tep_id = f.id AND b.chu_so_huu_id = :u AND t.xoa_at IS NULL)
                """, u, Long.class);
        run(u, "UPDATE nguoi_dung SET anh_dai_dien_id = NULL WHERE id = :u");
        ketQua.put("theGoMediaBanSao", update("DELETE FROM the_tep WHERE tep_id IN (:ids)", files));
        update("DELETE FROM am_thanh_tts WHERE tep_tin_id IN (:ids)", files);
        ketQua.put("tepDaXoa", update("""
                UPDATE tep_tin SET trang_thai_xoa = 'DA_XOA', xoa_at = :now, updated_at = :now WHERE id IN (:ids)
                """, files, now));

        run(u, """
                UPDATE dang_ky_goi SET trang_thai = 'HET_HAN', version = version + 1, updated_at = :now
                WHERE nguoi_dung_id = :u AND trang_thai = 'HIEU_LUC'
                """);
        run(u, """
                UPDATE giao_dich_thanh_toan SET trang_thai = 'HET_HAN', version = version + 1, updated_at = :now
                WHERE nguoi_dung_id = :u AND trang_thai = 'CHO_THANH_TOAN'
                """);
        ketQua.put("giaoDichGiuLai", jdbc.queryForObject(
                "SELECT COUNT(*) FROM giao_dich_thanh_toan WHERE nguoi_dung_id = :u", u, Long.class));

        run(u, """
                UPDATE nguoi_dung
                SET email = CONCAT('deleted-', id, '@deleted.invalid'), ten_hien_thi = :ten, password_hash = NULL,
                    email_xac_thuc_at = NULL, dang_nhap_cuoi_at = NULL, trang_thai = 'DANG_XOA',
                    version = version + 1, updated_at = :now
                WHERE id = :u
                """);
        return ketQua;
    }

    private int run(MapSqlParameterSource params, String sql) {
        return jdbc.update(sql, params);
    }

    private List<Long> ids(String sql, Collection<Long> ids) {
        List<Long> result = new ArrayList<>();
        for (List<Long> chunk : chunks(ids)) {
            result.addAll(jdbc.queryForList(sql, new MapSqlParameterSource("ids", chunk), Long.class));
        }
        return result;
    }

    private int update(String sql, Collection<Long> ids) {
        return update(sql, ids, null);
    }

    private int update(String sql, Collection<Long> ids, Instant now) {
        int total = 0;
        for (List<Long> chunk : chunks(ids)) {
            MapSqlParameterSource params = new MapSqlParameterSource("ids", chunk);
            if (now != null) {
                params.addValue("now", Timestamp.from(now));
            }
            total += jdbc.update(sql, params);
        }
        return total;
    }

    private static List<List<Long>> chunks(Collection<Long> ids) {
        List<Long> list = List.copyOf(ids);
        List<List<Long>> chunks = new ArrayList<>();
        for (int i = 0; i < list.size(); i += CHUNK) {
            chunks.add(list.subList(i, Math.min(list.size(), i + CHUNK)));
        }
        return chunks;
    }
}
