package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.dto.ReminderTarget;
import com.do_an_tot_nghiep.k28.account.entity.CaiDatThongBao;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CaiDatThongBaoRepository extends JpaRepository<CaiDatThongBao, Long> {

    @Query("""
            select new com.do_an_tot_nghiep.k28.account.dto.ReminderTarget(
                u.id, u.email, u.tenHienThi, u.muiGio, c.gioNhac, c.nhanTrongUngDung, c.nhanEmail)
            from CaiDatThongBao c join NguoiDung u on u.id = c.nguoiDungId
            where u.trangThai = :trangThai
              and c.nhacHoc = true
              and c.gioNhac is not null
              and (c.nhanTrongUngDung = true or c.nhanEmail = true)
            order by u.id
            """)
    List<ReminderTarget> reminderTargets(@Param("trangThai") TrangThaiNguoiDung trangThai);
}
