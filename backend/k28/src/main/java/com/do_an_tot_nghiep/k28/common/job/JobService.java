package com.do_an_tot_nghiep.k28.common.job;

import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.job.repository.TacVuNenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;

@Service
@RequiredArgsConstructor
public class JobService {

    private final TacVuNenRepository jobs;
    private final JsonMapper mapper;
    private final JobProperties props;
    private final Clock clock;

    @Transactional(propagation = Propagation.MANDATORY)
    public Long enqueue(String loai, Object payload) {
        String json = mapper.writeValueAsString(payload);
        TacVuNen job = TacVuNen.moi(loai, json, props.maxRetry(), clock.instant());
        return jobs.save(job).getId();
    }
}
