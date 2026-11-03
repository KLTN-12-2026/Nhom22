package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.Nhan;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.*;
import com.do_an_tot_nghiep.k28.content.dto.CsvCommitRequest;
import com.do_an_tot_nghiep.k28.content.service.CsvCommitService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestPropertySource(properties = "app.files.cleanup.enabled=false")
class FR05CsvTest extends AbstractIntegrationTest {
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired TheTuVungRepository cards;
    @Autowired NhanRepository tags;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;
    @Autowired StringRedisTemplate redis;
    @Autowired CsvCommitService commits;
    private Long userId;
    private Long deckId;
    private Cookie session;

    @BeforeEach
    void fixtures() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        var user = NguoiDung.register(email, "CSV tester", passwords.encode("matkhau123"),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        userId = users.saveAndFlush(user).getId();
        session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("email",email,"password","matkhau123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        deckId = decks.saveAndFlush(BoThe.create(userId,null,"CSV",null,TrinhDo.CO_BAN,QuyenTruyCap.RIENG_TU)).getId();
    }

    @Test
    void tc04_previewNormalizesWarnsAndDoesNotWrite() throws Exception {
        cards.saveAndFlush(TheTuVung.create(deckId,"apple","noun","táo",null,null,null,1,null));
        var result = preview("\uFEFFtu,tuLoai,nghiaVi,doKho\r\n APPLE ,noun,táo,\r\napple,noun,quả táo,2\r\nbad,noun,,9\r\n");
        assertThat(result.get("validRows").asInt()).isEqualTo(2);
        assertThat(result.get("invalidRows").asInt()).isEqualTo(1);
        assertThat(result.get("rows").get(0).get("data").get("tu").asText()).isEqualTo("APPLE");
        assertThat(result.get("rows").get(0).get("trung").asBoolean()).isTrue();
        assertThat(result.get("rows").get(0).get("dongTrungNumbers").get(0).asInt()).isEqualTo(2);
        assertThat(countCards()).isEqualTo(1);
        Long ttl = redis.getExpire("csv:preview:v1:"+userId+":"+result.get("importId").asText());
        assertThat(ttl).isBetween(1790L,1800L);
    }

    @Test
    void tc04_commitsSelectedRowsAndReplaysAfterExpiryAndDeletion() throws Exception {
        var snapshot = preview("tu,nghiaVi\napple,táo\nbad,\npear,lê\n");
        String id = snapshot.get("importId").asText();
        var first = commit(id,"retry",List.of(3,1),200);
        assertThat(first.get("importedCount").asInt()).isEqualTo(2);
        assertThat(first.get("items").get(0).get("theId").isString()).isTrue();
        redis.delete("csv:preview:v1:"+userId+":"+id);
        jdbc.update("UPDATE bo_the SET xoa_at=CURRENT_TIMESTAMP(3) WHERE id=?",deckId);
        assertThat(commit(id,"retry",List.of(1,3),200)).isEqualTo(first);
        assertThat(countCards()).isEqualTo(2);
        commit(id,"retry",List.of(1),409);
    }

    @Test
    void tc04_samePreviewCannotBeCommittedWithAnotherKey() throws Exception {
        String id=preview("tu,nghiaVi\napple,táo\n").get("importId").asText();
        commit(id,"first",List.of(1),200);
        commit(id,"second",List.of(1),409);
        assertThat(countCards()).isEqualTo(1);
    }

    @Test
    void tc04_invalidSelectionRollsBackAndSameKeyCanRetry() throws Exception {
        String id=preview("tu,nghiaVi\napple,táo\nbad,\n").get("importId").asText();
        commit(id,"rollback",List.of(1,2),400);
        assertThat(countCards()).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM yeu_cau_nhap_csv WHERE nguoi_dung_id=?",Long.class,userId)).isZero();
        commit(id,"rollback",List.of(1),200);
    }

    @Test
    void tc04_missingTagsAndTagDeletionAreExplicit() throws Exception {
        Long tag=tags.saveAndFlush(Nhan.create("csv-"+UUID.randomUUID())).getId();
        var invalid=preview("tu,nghiaVi,nhanIds\na,táo,9223372036854775807\n");
        assertThat(invalid.get("invalidRows").asInt()).isEqualTo(1);
        String id=preview("tu,nghiaVi,nhanIds\na,táo,"+tag+"\n").get("importId").asText();
        tags.deleteById(tag);
        commit(id,"tag-gone",List.of(1),409);
        assertThat(countCards()).isZero();
    }

    @Test
    void tc04_mappingQuotesMultilineAndDefaultDifficulty() throws Exception {
        var file=new MockMultipartFile("file","custom.csv","text/csv",
                "English,Vietnamese,Unused\r\n\"a,b\",\"nghĩa\r\nhai dòng\",x\r\n".getBytes(StandardCharsets.UTF_8));
        var mapping=new MockMultipartFile("mapping","","application/json",
                "{\"tu\":\"English\",\"nghiaVi\":\"Vietnamese\"}".getBytes(StandardCharsets.UTF_8));
        var result=body(mockMvc.perform(multipart(path()).file(file).file(mapping).cookie(session).with(xsrf()))
                .andExpect(status().isOk()).andReturn());
        assertThat(result.get("ignoredColumns").get(0).asText()).isEqualTo("Unused");
        assertThat(result.get("rows").get(0).get("data").get("tu").asText()).isEqualTo("a,b");
        assertThat(result.get("rows").get(0).get("data").get("nghiaVi").asText()).contains("\r\n");
        assertThat(result.get("rows").get(0).get("data").get("doKho").asInt()).isEqualTo(1);
    }

    @Test
    void tc04_authOwnerDeletedDeckAndCsrf() throws Exception {
        var file=new MockMultipartFile("file","a.csv","text/csv","tu,nghiaVi\na,b\n".getBytes());
        mockMvc.perform(multipart(path()).file(file).with(xsrf())).andExpect(status().isUnauthorized());
        mockMvc.perform(multipart(path()).file(file).cookie(session)).andExpect(status().isForbidden());
        jdbc.update("UPDATE bo_the SET chu_so_huu_id=1,quyen_truy_cap='CONG_KHAI' WHERE id=?",deckId);
        mockMvc.perform(multipart(path()).file(file).cookie(session).with(xsrf())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/decks/"+deckId+"/export").cookie(session)).andExpect(status().isNotFound());
        jdbc.update("UPDATE bo_the SET chu_so_huu_id=?,xoa_at=CURRENT_TIMESTAMP(3) WHERE id=?",userId,deckId);
        mockMvc.perform(multipart(path()).file(file).cookie(session).with(xsrf())).andExpect(status().isNotFound());
    }

    @Test
    void tc04_missingFileMalformedUtf8AndInvalidHeaders() throws Exception {
        mockMvc.perform(multipart(path()).cookie(session).with(xsrf())).andExpect(status().isBadRequest());
        for(byte[] bytes:List.of(new byte[]{(byte)0xc3,0x28},"tu,tu\na,b\n".getBytes(),
                "word,meaning\na,b\n".getBytes(),"tu,nghiaVi\n".getBytes())) {
            mockMvc.perform(multipart(path()).file(new MockMultipartFile("file",bytes)).cookie(session).with(xsrf()))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
        mockMvc.perform(multipart(path())
                .file(new MockMultipartFile("file","a.csv","text/csv","tu,nghiaVi\na,b\n".getBytes()))
                .file(new MockMultipartFile("mapping","","text/plain","{}".getBytes()))
                .cookie(session).with(xsrf())).andExpect(status().isBadRequest());
    }

    @Test
    void tc04_limitsAndRowShape() throws Exception {
        for(byte[] bytes:List.of(new byte[1048577],("tu,nghiaVi\n"+"a,b\n".repeat(1001)).getBytes())) {
            mockMvc.perform(multipart(path()).file(new MockMultipartFile("file",bytes)).cookie(session).with(xsrf()))
                    .andExpect(status().isBadRequest());
        }
        var result=preview("tu,nghiaVi\na,b,extra\n\n");
        assertThat(result.get("totalRows").asInt()).isEqualTo(2);
        assertThat(result.get("invalidRows").asInt()).isEqualTo(2);
        assertThat(preview("tu,nghiaVi\n"+"a,b\n".repeat(1000)).get("totalRows").asInt()).isEqualTo(1000);
    }

    @Test
    void tc04_exportUsesBomQuotesFormulaGuardAndExcludesDeleted() throws Exception {
        cards.saveAndFlush(TheTuVung.create(deckId,"=1+1",null,"nghĩa, \"kép\"\n dòng",null,null,null,1," @SUM(1)"));
        var removed=cards.saveAndFlush(TheTuVung.create(deckId,"deleted",null,"x",null,null,null,1,null));
        jdbc.update("UPDATE the_tu_vung SET xoa_at=CURRENT_TIMESTAMP(3) WHERE id=?",removed.getId());
        var response=mockMvc.perform(get("/api/v1/decks/"+deckId+"/export").cookie(session))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
                .andExpect(header().string("Content-Disposition","attachment; filename=\"deck-"+deckId+".csv\""))
                .andReturn().getResponse();
        String csv=new String(response.getContentAsByteArray(),StandardCharsets.UTF_8);
        assertThat(csv).startsWith("\uFEFFtu,tuLoai,nghiaVi,phienAm,viDuEn,dichVi,doKho,nguon,nhanIds\r\n")
                .contains("'=1+1","' @SUM(1)","\"\"kép\"\"").doesNotContain("deleted","chuSoHuuId","anhId","version");
    }

    @Test
    void tc04_expiredOrForeignPreviewAndDuplicateSelection() throws Exception {
        String id=preview("tu,nghiaVi\na,b\n").get("importId").asText();
        commit(id,"bad",List.of(1,1),400);
        mockMvc.perform(post("/api/v1/imports/"+id+"/commit").cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"rowNumbers\":[1]}"))
                .andExpect(status().isBadRequest());
        assertThatThrownBy(()->commits.commit(1L,id,"foreign",new CsvCommitRequest(List.of(1))))
                .hasMessageContaining("không tồn tại");
        redis.delete("csv:preview:v1:"+userId+":"+id);
        commit(id,"expired",List.of(1),404);
    }

    @Test
    void tc04_concurrentSameKeyAndDifferentKeysCreateOnce() throws Exception {
        for(boolean sameKey:List.of(true,false)) {
            String id=preview("tu,nghiaVi\na,b\n").get("importId").asText();
            CyclicBarrier barrier=new CyclicBarrier(2);
            try(var pool=Executors.newFixedThreadPool(2)) {
                var a=pool.submit(()-> {barrier.await();try {return commits.commit(userId,id,"race-"+id,new CsvCommitRequest(List.of(1)));}catch(com.do_an_tot_nghiep.k28.common.exception.ApiException ex){return ex;}});
                var b=pool.submit(()-> {barrier.await();try {return commits.commit(userId,id,sameKey?"race-"+id:"other-"+id,new CsvCommitRequest(List.of(1)));}catch(com.do_an_tot_nghiep.k28.common.exception.ApiException ex){return ex;}});
                var first=a.get(30,TimeUnit.SECONDS);
                var second=b.get(30,TimeUnit.SECONDS);
                if(sameKey)assertThat(second).isEqualTo(first);
                else assertThat(List.of(first,second).stream().filter(value->value instanceof com.do_an_tot_nghiep.k28.common.exception.ApiException).count()).isEqualTo(1);
            }
        }
        assertThat(countCards()).isEqualTo(2);
    }

    private String path(){return "/api/v1/decks/"+deckId+"/imports/preview";}
    @Test
    void tc04_exportIncludesMoreThan1000CardsAndOwnerCanExportHiddenDeck() throws Exception {
        var many = java.util.stream.IntStream.range(0,1001).mapToObj(index ->
                TheTuVung.create(deckId,"word"+index,null,"nghĩa",null,null,null,1,null)).toList();
        cards.saveAllAndFlush(many);
        jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet='DA_AN' WHERE id=?",deckId);
        byte[] bytes=mockMvc.perform(get("/api/v1/decks/"+deckId+"/export").cookie(session))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(bytes,StandardCharsets.UTF_8).lines().count()).isEqualTo(1002);
        assertThat(preview("tu,nghiaVi\na,b\n").get("validRows").asInt()).isEqualTo(1);
    }
    private JsonNode preview(String csv)throws Exception {
        return body(mockMvc.perform(multipart(path()).file(new MockMultipartFile("file","a.csv","text/csv",csv.getBytes(StandardCharsets.UTF_8)))
                .cookie(session).with(xsrf())).andExpect(status().isOk()).andReturn());
    }
    private JsonNode commit(String id,String key,List<Integer> rows,int status)throws Exception {
        return body(mockMvc.perform(post("/api/v1/imports/"+id+"/commit").cookie(session).with(xsrf())
                .header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("rowNumbers",rows))))
                .andExpect(status().is(status)).andReturn());
    }
    private JsonNode body(MvcResult result){return jsonMapper.readTree(result.getResponse().getContentAsByteArray());}
    private long countCards(){return jdbc.queryForObject("SELECT COUNT(*) FROM the_tu_vung WHERE bo_the_id=?",Long.class,deckId);}
}
