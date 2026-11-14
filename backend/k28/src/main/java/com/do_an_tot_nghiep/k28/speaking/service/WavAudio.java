package com.do_an_tot_nghiep.k28.speaking.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

final class WavAudio {

    static final int SAMPLE_RATE = 16000;
    static final int BYTES_PER_SECOND = SAMPLE_RATE * 2;

    private WavAudio() {
    }

    static int durationMs(byte[] wav) {
        if (wav == null || wav.length < 44 || !tag(wav, 0, "RIFF") || !tag(wav, 8, "WAVE")) {
            throw invalid();
        }
        ByteBuffer buffer = ByteBuffer.wrap(wav).order(ByteOrder.LITTLE_ENDIAN);
        boolean format = false;
        int offset = 12;
        while (offset + 8 <= wav.length) {
            long size = Integer.toUnsignedLong(buffer.getInt(offset + 4));
            int body = offset + 8;
            if (tag(wav, offset, "fmt ")) {
                if (size < 16 || body + 16 > wav.length
                        || buffer.getShort(body) != 1
                        || buffer.getShort(body + 2) != 1
                        || buffer.getInt(body + 4) != SAMPLE_RATE
                        || buffer.getInt(body + 8) != BYTES_PER_SECOND
                        || buffer.getShort(body + 12) != 2
                        || buffer.getShort(body + 14) != 16) {
                    throw invalid();
                }
                format = true;
            } else if (tag(wav, offset, "data")) {
                long data = Math.min(size, wav.length - body) & ~1L;
                if (!format || data <= 0) {
                    throw invalid();
                }
                return (int) (data * 1000 / BYTES_PER_SECOND);
            }
            long next = body + size + (size & 1);
            if (next > Integer.MAX_VALUE) {
                break;
            }
            offset = (int) next;
        }
        throw invalid();
    }

    private static boolean tag(byte[] wav, int offset, String value) {
        return new String(wav, offset, 4, StandardCharsets.US_ASCII).equals(value);
    }

    private static ApiException invalid() {
        return new ApiException(ErrorCode.BUSINESS_RULE, "file",
                "Bản ghi phải là WAV PCM 16 kHz, 16 bit, một kênh");
    }
}
