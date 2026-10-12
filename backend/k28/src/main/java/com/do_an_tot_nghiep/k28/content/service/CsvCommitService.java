package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.CsvCommitRequest;
import com.do_an_tot_nghiep.k28.content.dto.CsvCommitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class CsvCommitService {
    private final CsvCommitTransaction transaction;
    private final CsvImportSnapshotStore snapshots;

    public CsvCommitResponse commit(Long userId, String importId, String key, CsvCommitRequest request) {
        CsvImportSnapshotStore.checkedId(importId);
        if (key == null || !key.matches("[A-Za-z0-9._:-]{1,128}")) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Idempotency-Key",
                    "Gửi Idempotency-Key từ 1 đến 128 ký tự ASCII hợp lệ");
        }
        var numbers = request.rowNumbers();
        if (numbers == null || numbers.isEmpty() || numbers.size() > 1000
                || numbers.stream().anyMatch(n -> n == null || n < 1 || n > 1000)
                || new HashSet<>(numbers).size() != numbers.size()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "rowNumbers",
                    "Chọn từ 1 đến 1000 số dòng hợp lệ, không trùng nhau");
        }
        var selected = numbers.stream().sorted().toList();
        String hash = hash(importId + ":" + selected);
        var replay = transaction.replay(userId, key, importId, hash);
        if (replay != null) {
            return replay;
        }
        return transaction.commit(userId, key, hash, snapshots.load(userId, importId), selected);
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
