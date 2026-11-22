package com.do_an_tot_nghiep.k28.common.realtime;

import com.do_an_tot_nghiep.k28.common.security.AuthUser;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealtimeHub implements MessageListener {

    static final long THOI_GIAN_MO_MS = 15 * 60_000L;
    static final long RETRY_MS = 5_000L;
    static final String VAI_TRO_QUAN_TRI = "ADMIN";

    private final JsonMapper json;
    private final Map<Long, Set<KetNoi>> ketNoi = new ConcurrentHashMap<>();

    record KetNoi(Long nguoiDungId, SseEmitter emitter, boolean quanTri) {
    }

    public SseEmitter open(AuthUser user) {
        SseEmitter emitter = new SseEmitter(THOI_GIAN_MO_MS);
        KetNoi kn = new KetNoi(user.id(), emitter, user.roles().contains(VAI_TRO_QUAN_TRI));
        ketNoi.computeIfAbsent(user.id(), id -> ConcurrentHashMap.newKeySet()).add(kn);
        emitter.onCompletion(() -> remove(kn));
        emitter.onTimeout(emitter::complete);
        emitter.onError(e -> remove(kn));
        send(kn, SseEmitter.event().name("SAN_SANG").reconnectTime(RETRY_MS).data("{}"), false);
        return emitter;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        SuKienRealtime event;
        try {
            event = json.readValue(new String(message.getBody(), StandardCharsets.UTF_8), SuKienRealtime.class);
        } catch (RuntimeException e) {
            log.warn("Unreadable realtime message ({})", e.getClass().getSimpleName());
            return;
        }
        dispatch(event);
    }

    void dispatch(SuKienRealtime event) {
        Stream<KetNoi> targets = switch (event.phamVi()) {
            case NGUOI_DUNG -> ketNoi.getOrDefault(event.nguoiDungId(), Set.of()).stream();
            case QUAN_TRI -> all().filter(kn -> kn.quanTri() && !Objects.equals(kn.nguoiDungId(), event.nguoiDungId()));
            case TAT_CA -> all();
        };
        String data = json.writeValueAsString(Map.of("loai", event.loai().name(), "id", event.id() == null ? "" : event.id()));
        boolean close = event.loai() == LoaiSuKien.TAI_KHOAN_BI_KHOA;
        targets.toList().forEach(kn -> send(kn, SseEmitter.event().name(event.loai().name()).data(data), close));
    }

    @Scheduled(fixedDelay = 25_000L)
    void heartbeat() {
        all().toList().forEach(kn -> send(kn, SseEmitter.event().comment("ping"), false));
    }

    int openCount(Long nguoiDungId) {
        return ketNoi.getOrDefault(nguoiDungId, Set.of()).size();
    }

    private Stream<KetNoi> all() {
        return ketNoi.values().stream().flatMap(Set::stream);
    }

    private void send(KetNoi kn, SseEmitter.SseEventBuilder event, boolean close) {
        try {
            kn.emitter().send(event);
            if (close) {
                remove(kn);
                kn.emitter().complete();
            }
        } catch (IOException | IllegalStateException e) {
            remove(kn);
        }
    }

    private void remove(KetNoi kn) {
        ketNoi.computeIfPresent(kn.nguoiDungId(), (id, set) -> {
            set.remove(kn);
            return set.isEmpty() ? null : set;
        });
    }
}
