package com.do_an_tot_nghiep.k28.common.document;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

@Component
public class DocxTextReader {

    public static final String MIME_TYPE =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    public static class UnreadableDocumentException extends RuntimeException {
        public UnreadableDocumentException(String message) {
            super(message);
        }
    }

    public DocxTextReader() {
        ZipSecureFile.setMinInflateRatio(0.01);
        ZipSecureFile.setMaxEntrySize(20L * 1024 * 1024);
        ZipSecureFile.setMaxTextSize(2L * 1024 * 1024);
    }

    public String read(byte[] content) {
        try (var extractor = new XWPFWordExtractor(new XWPFDocument(new ByteArrayInputStream(content)))) {
            return normalize(extractor.getText());
        } catch (IOException | RuntimeException e) {
            throw new UnreadableDocumentException("Không đọc được tệp Word");
        }
    }

    public void ensureReadable(byte[] content) {
        read(content);
    }

    private String normalize(String text) {
        return text.replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("[\\t\\x0B\\f\\u00A0]+", " ")
                .replaceAll("\n{3,}", "\n\n")
                .strip();
    }
}
