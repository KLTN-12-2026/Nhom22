package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.content.service.CsvExportService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.assertj.core.api.Assertions.assertThat;

class FR05CsvFormulaTest {
    @ParameterizedTest
    @ValueSource(strings={"=1+1","+SUM(1)","-1","@SUM(1)","\t=cmd","\rtext","\ntext","  =1","\uFEFF@x","＝1","＋1","－1","＠x"})
    void tc04_guardsSpreadsheetCells(String value){assertThat(CsvExportService.safeCell(value)).isEqualTo("'"+value);}
    @ParameterizedTest
    @ValueSource(strings={"apple","a,b","a\"b","line\nnext","'already","","nghĩa tiếng Việt"})
    void tc04_preservesOrdinaryText(String value){assertThat(CsvExportService.safeCell(value)).isEqualTo(value);}
}
