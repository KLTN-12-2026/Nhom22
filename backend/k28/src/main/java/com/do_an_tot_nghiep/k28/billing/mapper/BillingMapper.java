package com.do_an_tot_nghiep.k28.billing.mapper;

import com.do_an_tot_nghiep.k28.billing.dto.PlanResponse;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.StudentVerificationResponse;
import com.do_an_tot_nghiep.k28.billing.entity.KhuyenMai;
import com.do_an_tot_nghiep.k28.billing.entity.XacMinhHssv;
import com.do_an_tot_nghiep.k28.billing.dto.TransactionResponse;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import org.mapstruct.Mapper;

@Mapper
public interface BillingMapper {

    PlanResponse toResponse(GoiDichVu goi, Integer hanMucAi, Integer hanMucAnh, Integer hanMucPhatAm, Integer hanMucTts);

    TransactionResponse toResponse(GiaoDichThanhToan giaoDich, String tenGoi);

    PromotionResponse toResponse(KhuyenMai khuyenMai, long soLuotDaDung);

    StudentVerificationResponse toResponse(XacMinhHssv xacMinhHssv);
}
