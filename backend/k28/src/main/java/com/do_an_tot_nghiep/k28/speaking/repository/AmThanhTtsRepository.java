package com.do_an_tot_nghiep.k28.speaking.repository;

import com.do_an_tot_nghiep.k28.speaking.entity.AmThanhTts;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AmThanhTtsRepository extends JpaRepository<AmThanhTts, Long> {

    Optional<AmThanhTts> findByKhoaCache(String khoaCache);
}
