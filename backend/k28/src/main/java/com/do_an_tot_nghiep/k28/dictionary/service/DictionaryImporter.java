package com.do_an_tot_nghiep.k28.dictionary.service;

import com.do_an_tot_nghiep.k28.dictionary.config.DictionaryProperties;
import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import com.do_an_tot_nghiep.k28.dictionary.repository.DictionaryImportRepository;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class DictionaryImporter {

    private static final int MAX_TU = 120;
    private static final int MAX_PHIEN_AM = 100;
    private static final int MAX_TOM_TAT = 255;

    private final DictionaryProperties properties;
    private final DictionaryImportRepository repository;
    private final JsonMapper json;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (properties.importOnStartup()) {
            importAll();
        }
    }

    public synchronized void importAll() {
        importIfIncomplete(ChieuTuDien.ANH_VIET, properties.anhViet());
        importIfIncomplete(ChieuTuDien.VIET_ANH, properties.vietAnh());
    }

    private void importIfIncomplete(ChieuTuDien chieu, Resource resource) {
        if (resource == null || !resource.exists()) {
            log.warn("Dictionary source for {} not found", chieu);
            return;
        }
        long expected = countLines(resource);
        long current = repository.count(chieu);
        if (current >= expected) {
            return;
        }
        log.info("Importing dictionary {}: {} of {} entries present", chieu, current, expected);
        int batchSize = Math.max(100, properties.batchSize());
        List<DictionaryImportRepository.Row> batch = new ArrayList<>(batchSize);
        try (BufferedReader reader = open(resource)) {
            String line;
            while ((line = reader.readLine()) != null) {
                DictionaryImportRepository.Row row = parse(line);
                if (row == null) {
                    continue;
                }
                batch.add(row);
                if (batch.size() >= batchSize) {
                    repository.insertIgnore(chieu, batch);
                    batch.clear();
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (!batch.isEmpty()) {
            repository.insertIgnore(chieu, batch);
        }
        log.info("Dictionary {} ready with {} entries", chieu, repository.count(chieu));
    }

    private DictionaryImportRepository.Row parse(String line) {
        if (line.isBlank()) {
            return null;
        }
        JsonNode node = json.readTree(line);
        String tu = text(node, "tu");
        JsonNode noiDung = node.get("noiDung");
        if (tu == null || tu.length() > MAX_TU || noiDung == null || noiDung.isNull()) {
            return null;
        }
        return new DictionaryImportRepository.Row(
                tu,
                DictionaryText.normalize(tu),
                cut(text(node, "phienAm"), MAX_PHIEN_AM),
                cut(text(node, "tomTat"), MAX_TOM_TAT),
                noiDung.toString());
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asString();
    }

    private static String cut(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }

    private static long countLines(Resource resource) {
        try (BufferedReader reader = open(resource)) {
            return reader.lines().filter(line -> !line.isBlank()).count();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static BufferedReader open(Resource resource) throws IOException {
        InputStream in = resource.getInputStream();
        String name = resource.getFilename();
        if (name != null && name.endsWith(".gz")) {
            in = new GZIPInputStream(in, 1 << 16);
        }
        return new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8), 1 << 16);
    }
}
