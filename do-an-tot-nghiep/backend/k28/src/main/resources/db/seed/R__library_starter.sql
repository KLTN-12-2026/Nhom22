INSERT INTO nguoi_dung (email, ten_hien_thi, trang_thai, password_hash)
VALUES ('library-editor@vocab.local', 'VocabLearning', 'BI_KHOA', NULL)
ON DUPLICATE KEY UPDATE email = email;

SET @library_author = (SELECT id FROM nguoi_dung WHERE email = 'library-editor@vocab.local');

SET @library_catalog = '[
  {"ten":"Khởi động — Giao tiếp mới bắt đầu","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU","the":[
    {"tu":"hello","loai":"interjection","nghia":"xin chào","viDu":"Hello, my name is An.","dich":"Xin chào, tôi tên là An."},
    {"tu":"thank you","loai":"phrase","nghia":"cảm ơn","viDu":"Thank you for your help.","dich":"Cảm ơn bạn đã giúp đỡ."},
    {"tu":"please","loai":"adverb","nghia":"làm ơn; vui lòng","viDu":"Please sit here.","dich":"Vui lòng ngồi ở đây."}
  ]},
  {"ten":"Khởi động — Giao tiếp cơ bản","mucTieu":"GIAO_TIEP","trinhDo":"CO_BAN","the":[
    {"tu":"appointment","loai":"noun","nghia":"cuộc hẹn","viDu":"I have an appointment at ten.","dich":"Tôi có một cuộc hẹn lúc mười giờ."},
    {"tu":"directions","loai":"noun","nghia":"chỉ dẫn đường đi","viDu":"Could you give me directions to the station?","dich":"Bạn có thể chỉ đường đến nhà ga cho tôi không?"},
    {"tu":"available","loai":"adjective","nghia":"có sẵn; rảnh","viDu":"Are you available tomorrow?","dich":"Ngày mai bạn có rảnh không?"}
  ]},
  {"ten":"Khởi động — Giao tiếp trung cấp","mucTieu":"GIAO_TIEP","trinhDo":"TRUNG_CAP","the":[
    {"tu":"clarify","loai":"verb","nghia":"làm rõ","viDu":"Could you clarify your suggestion?","dich":"Bạn có thể làm rõ đề xuất của mình không?"},
    {"tu":"compromise","loai":"noun","nghia":"sự thỏa hiệp","viDu":"We reached a compromise.","dich":"Chúng tôi đã đạt được một thỏa hiệp."},
    {"tu":"perspective","loai":"noun","nghia":"góc nhìn; quan điểm","viDu":"I understand your perspective.","dich":"Tôi hiểu quan điểm của bạn."}
  ]},
  {"ten":"Khởi động — Giao tiếp nâng cao","mucTieu":"GIAO_TIEP","trinhDo":"NANG_CAO","the":[
    {"tu":"nuance","loai":"noun","nghia":"sắc thái khác biệt tinh tế","viDu":"The translation misses an important nuance.","dich":"Bản dịch bỏ sót một sắc thái quan trọng."},
    {"tu":"articulate","loai":"verb","nghia":"diễn đạt rõ ràng","viDu":"She articulated her concerns clearly.","dich":"Cô ấy diễn đạt rõ những điều mình lo ngại."},
    {"tu":"reconcile","loai":"verb","nghia":"dung hòa; hòa giải","viDu":"We need to reconcile these different views.","dich":"Chúng ta cần dung hòa những quan điểm khác nhau này."}
  ]},
  {"ten":"Khởi động — TOEIC mới bắt đầu","mucTieu":"TOEIC","trinhDo":"MOI_BAT_DAU","the":[
    {"tu":"office","loai":"noun","nghia":"văn phòng","viDu":"The office opens at eight.","dich":"Văn phòng mở cửa lúc tám giờ."},
    {"tu":"meeting","loai":"noun","nghia":"cuộc họp","viDu":"The meeting starts soon.","dich":"Cuộc họp sắp bắt đầu."},
    {"tu":"ticket","loai":"noun","nghia":"vé","viDu":"Please show your ticket.","dich":"Vui lòng xuất trình vé của bạn."}
  ]},
  {"ten":"Khởi động — TOEIC cơ bản","mucTieu":"TOEIC","trinhDo":"CO_BAN","the":[
    {"tu":"invoice","loai":"noun","nghia":"hóa đơn","viDu":"Please send the invoice by email.","dich":"Vui lòng gửi hóa đơn qua email."},
    {"tu":"shipment","loai":"noun","nghia":"lô hàng được vận chuyển","viDu":"The shipment arrived today.","dich":"Lô hàng đã đến hôm nay."},
    {"tu":"reservation","loai":"noun","nghia":"việc đặt chỗ","viDu":"I would like to confirm my reservation.","dich":"Tôi muốn xác nhận việc đặt chỗ của mình."}
  ]},
  {"ten":"Khởi động — TOEIC trung cấp","mucTieu":"TOEIC","trinhDo":"TRUNG_CAP","the":[
    {"tu":"reimbursement","loai":"noun","nghia":"việc hoàn trả chi phí","viDu":"Submit your receipts for reimbursement.","dich":"Nộp các biên lai để được hoàn trả chi phí."},
    {"tu":"procurement","loai":"noun","nghia":"việc mua sắm hàng hóa cho tổ chức","viDu":"The procurement team reviewed the offers.","dich":"Nhóm mua sắm đã xem xét các chào hàng."},
    {"tu":"compliance","loai":"noun","nghia":"sự tuân thủ","viDu":"The audit checks compliance with safety rules.","dich":"Cuộc kiểm tra đánh giá việc tuân thủ quy định an toàn."}
  ]},
  {"ten":"Khởi động — TOEIC nâng cao","mucTieu":"TOEIC","trinhDo":"NANG_CAO","the":[
    {"tu":"contingency","loai":"noun","nghia":"tình huống có thể xảy ra ngoài dự kiến","viDu":"We prepared a contingency plan.","dich":"Chúng tôi đã chuẩn bị một kế hoạch dự phòng."},
    {"tu":"liability","loai":"noun","nghia":"trách nhiệm pháp lý","viDu":"The contract limits the liability of each party.","dich":"Hợp đồng giới hạn trách nhiệm pháp lý của mỗi bên."},
    {"tu":"expedite","loai":"verb","nghia":"đẩy nhanh tiến độ","viDu":"Please expedite the delivery.","dich":"Vui lòng đẩy nhanh việc giao hàng."}
  ]}
]';

INSERT INTO bo_the (chu_so_huu_id, ten, mo_ta, trinh_do, muc_tieu, quyen_truy_cap, trang_thai_kiem_duyet, bo_mau)
SELECT @library_author, catalog.ten, 'Bộ khởi động môi trường dev; nội dung tự biên soạn để kiểm thử và demo.',
       catalog.trinh_do, catalog.muc_tieu, 'CONG_KHAI', 'BINH_THUONG', TRUE
FROM JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    trinh_do VARCHAR(20) PATH '$.trinhDo',
    muc_tieu VARCHAR(20) PATH '$.mucTieu'
)) catalog
WHERE NOT EXISTS (
    SELECT 1 FROM bo_the existing
    WHERE existing.chu_so_huu_id = @library_author AND existing.ten = catalog.ten
);

INSERT INTO the_tu_vung (bo_the_id, tu, tu_loai, nghia_vi, vi_du_en, dich_vi, do_kho, nguon)
SELECT deck.id, catalog.tu, catalog.tu_loai, catalog.nghia, catalog.vi_du, catalog.dich,
       CASE deck.trinh_do WHEN 'MOI_BAT_DAU' THEN 1 WHEN 'CO_BAN' THEN 2 WHEN 'TRUNG_CAP' THEN 3 ELSE 4 END,
       'VocabLearning — nội dung mẫu dev tự biên soạn'
FROM JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    NESTED PATH '$.the[*]' COLUMNS (
        tu VARCHAR(100) PATH '$.tu',
        tu_loai VARCHAR(30) PATH '$.loai',
        nghia VARCHAR(500) PATH '$.nghia',
        vi_du VARCHAR(300) PATH '$.viDu',
        dich VARCHAR(300) PATH '$.dich'
    )
)) catalog
JOIN bo_the deck ON deck.chu_so_huu_id = @library_author AND deck.ten = catalog.ten
WHERE NOT EXISTS (
    SELECT 1 FROM the_tu_vung existing
    WHERE existing.bo_the_id = deck.id AND existing.tu = catalog.tu
);
