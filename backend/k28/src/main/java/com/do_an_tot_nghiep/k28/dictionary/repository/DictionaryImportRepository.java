package com.do_an_tot_nghiep.k28.dictionary.repository;

import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import java.util.List;
import java.util.StringJoiner;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DictionaryImportRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public long count(ChieuTuDien chieu) {
        Long value = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tu_dien WHERE chieu = :chieu",
                new MapSqlParameterSource("chieu", chieu.name()),
                Long.class);
        return value == null ? 0 : value;
    }

    public void insertIgnore(ChieuTuDien chieu, List<Row> rows) {
        if (rows.isEmpty()) {
            return;
        }
        MapSqlParameterSource params = new MapSqlParameterSource("chieu", chieu.name());
        StringJoiner values = new StringJoiner(", ");
        for (int i = 0; i < rows.size(); i++) {
            Row row = rows.get(i);
            values.add("(:chieu, :tu" + i + ", :chuan" + i + ", :am" + i + ", :tom" + i + ", :nd" + i + ")");
            params.addValue("tu" + i, row.tu())
                    .addValue("chuan" + i, row.tuChuanHoa())
                    .addValue("am" + i, row.phienAm())
                    .addValue("tom" + i, row.tomTat())
                    .addValue("nd" + i, row.noiDung());
        }
        jdbc.update("INSERT IGNORE INTO tu_dien (chieu, tu, tu_chuan_hoa, phien_am, tom_tat, noi_dung) VALUES "
                + values, params);
    }

    public record Row(String tu, String tuChuanHoa, String phienAm, String tomTat, String noiDung) {
    }
}
