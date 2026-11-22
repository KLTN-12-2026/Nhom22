package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.account.dto.UserResponse;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class ReceiptRenderer {

    private static final DateTimeFormatter THOI_GIAN = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final Locale VI = Locale.forLanguageTag("vi-VN");

    public String render(GiaoDichThanhToan don, String tenGoi, UserResponse khach) {
        ZoneId zone = ZoneId.of(khach.muiGio());
        boolean moPhong = don.getCong() == CongThanhToan.MO_PHONG;
        StringBuilder html = new StringBuilder(2048)
                .append("<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\">")
                .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
                .append("<title>Biên nhận ").append(esc(don.getMaDon())).append("</title><style>")
                .append("body{font-family:Arial,Helvetica,sans-serif;color:#1f2933;background:#fff;margin:0;padding:32px}")
                .append("main{max-width:640px;margin:0 auto;border:1px solid #cbd2d9;padding:32px}")
                .append("h1{font-size:22px;margin:0 0 4px}p{margin:0 0 16px}")
                .append("table{width:100%;border-collapse:collapse;margin:16px 0}")
                .append("th,td{text-align:left;padding:8px 0;border-bottom:1px solid #e4e7eb;vertical-align:top}")
                .append("th{width:42%;font-weight:normal;color:#52606d}.tong td{font-weight:bold;font-size:18px}")
                .append(".nhan{border:1px solid #b44d12;color:#b44d12;padding:8px 12px;margin:0 0 16px}")
                .append(".ghi-chu{font-size:13px;color:#52606d}@media print{body{padding:0}main{border:0}}")
                .append("</style></head><body><main>")
                .append("<h1>Biên nhận thanh toán</h1><p>VocabLearning</p>");
        if (moPhong) {
            html.append("<p class=\"nhan\">Giao dịch mô phỏng dùng để demo, không phát sinh tiền thật.</p>");
        }
        html.append("<table>");
        row(html, "Mã đơn", don.getMaDon());
        row(html, "Người mua", khach.tenHienThi() + " (" + khach.email() + ")");
        row(html, "Gói", tenGoi + " — " + (don.getChuKy() == ChuKy.NAM ? "1 năm" : "1 tháng"));
        row(html, "Cổng thanh toán", moPhong ? "Mô phỏng" : "VNPay");
        if (don.getMaGiaoDichCong() != null) {
            row(html, "Mã giao dịch tại cổng", don.getMaGiaoDichCong());
        }
        row(html, "Thời gian thanh toán",
                THOI_GIAN.format(don.getHoanTatAt().atZone(zone)) + " (" + zone.getId() + ")");
        if (don.getGiamGia() > 0 || don.getKhauTru() > 0) {
            row(html, "Giá gốc", String.format(VI, "%,d", don.getGiaGoc()) + " ₫");
        }
        if (don.getGiamGia() > 0) {
            String nguon = don.isUuDaiHssv() ? "Ưu đãi học sinh, sinh viên"
                    : don.getMaKhuyenMai() != null ? "Khuyến mãi " + don.getMaKhuyenMai() : "Khuyến mãi";
            row(html, nguon, "−" + String.format(VI, "%,d", don.getGiamGia()) + " ₫");
        }
        if (don.getKhauTru() > 0) {
            row(html, "Trừ phần còn lại của gói cũ", "−" + String.format(VI, "%,d", don.getKhauTru()) + " ₫");
        }
        html.append("<tr class=\"tong\"><th>Số tiền</th><td>")
                .append(esc(String.format(VI, "%,d", don.getSoTien()))).append(" ₫</td></tr></table>")
                .append("<p class=\"ghi-chu\">Biên nhận này xác nhận bạn đã thanh toán gói dịch vụ. ")
                .append("Đây không phải hóa đơn giá trị gia tăng (VAT).</p></main></body></html>");
        return html.toString();
    }

    private static void row(StringBuilder html, String nhan, String giaTri) {
        html.append("<tr><th>").append(esc(nhan)).append("</th><td>").append(esc(giaTri)).append("</td></tr>");
    }

    private static String esc(String value) {
        return HtmlUtils.htmlEscape(value, "UTF-8");
    }
}
