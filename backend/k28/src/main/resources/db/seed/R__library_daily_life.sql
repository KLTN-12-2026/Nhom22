INSERT INTO nguoi_dung (email, ten_hien_thi, trang_thai, password_hash)
VALUES ('library-editor@vocab.local', 'VocabLearning', 'BI_KHOA', NULL)
ON DUPLICATE KEY UPDATE email = email;

SET @daily_author = (SELECT id FROM nguoi_dung WHERE email = 'library-editor@vocab.local');
SET @daily_now = UTC_TIMESTAMP(3);
SET @daily_source = 'VocabLearning — thư viện mẫu tự biên soạn, đã duyệt tay';

SET @daily_catalog = '[
  {"ten":"Khởi động — Một ngày của tôi","chuDe":"Gia đình & đời sống","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU",
   "moTa":"8 từ theo đúng trình tự một ngày: từ lúc chuông báo thức reo đến lúc đi ngủ. Bộ đầu tiên để làm quen cách học.","the":[
    {"tu":"alarm","loai":"noun","ipa":"/əˈlɑrm/","nghia":"đồng hồ báo thức","viDu":"My alarm rings at six o''clock.","dich":"Đồng hồ báo thức của tôi reo lúc sáu giờ."},
    {"tu":"wake up","loai":"phrasal verb","ipa":"/ˌweɪk ˈʌp/","nghia":"thức dậy","viDu":"I wake up early every day.","dich":"Tôi thức dậy sớm mỗi ngày."},
    {"tu":"brush my teeth","loai":"phrase","ipa":"/ˌbrʌʃ maɪ ˈtiθ/","nghia":"đánh răng","viDu":"I brush my teeth after breakfast.","dich":"Tôi đánh răng sau bữa sáng."},
    {"tu":"breakfast","loai":"noun","ipa":"/ˈbrɛkfəst/","nghia":"bữa sáng","viDu":"I have bread and milk for breakfast.","dich":"Tôi ăn bánh mì và uống sữa vào bữa sáng."},
    {"tu":"catch the bus","loai":"phrase","ipa":"/ˌkætʃ ðə ˈbʌs/","nghia":"bắt xe buýt","viDu":"I catch the bus at seven thirty.","dich":"Tôi bắt xe buýt lúc bảy giờ ba mươi."},
    {"tu":"lunch break","loai":"noun","ipa":"/ˈlʌntʃ ˌbreɪk/","nghia":"giờ nghỉ trưa","viDu":"We eat together during the lunch break.","dich":"Chúng tôi ăn cùng nhau trong giờ nghỉ trưa."},
    {"tu":"take a shower","loai":"phrase","ipa":"/ˌteɪk ə ˈʃaʊər/","nghia":"tắm (vòi sen)","viDu":"I take a shower when I get home.","dich":"Tôi tắm khi về đến nhà."},
    {"tu":"go to bed","loai":"phrase","ipa":"/ˌɡoʊ tə ˈbɛd/","nghia":"đi ngủ","viDu":"I go to bed at eleven.","dich":"Tôi đi ngủ lúc mười một giờ."}
  ]},
  {"ten":"Đời sống — Việc nhà và đồ dùng trong nhà","chuDe":"Gia đình & đời sống","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU",
   "moTa":"Những việc nhà quen thuộc và đồ vật bạn thấy mỗi ngày trong căn nhà của mình.","the":[
    {"tu":"do the dishes","loai":"phrase","ipa":"/ˌdu ðə ˈdɪʃɪz/","nghia":"rửa bát","viDu":"I do the dishes after dinner.","dich":"Tôi rửa bát sau bữa tối."},
    {"tu":"do the laundry","loai":"phrase","ipa":"/ˌdu ðə ˈlɔndri/","nghia":"giặt quần áo","viDu":"We do the laundry on Saturday.","dich":"Chúng tôi giặt quần áo vào thứ Bảy."},
    {"tu":"sweep","loai":"verb","ipa":"/swip/","nghia":"quét (nhà)","viDu":"Please sweep the kitchen floor.","dich":"Làm ơn quét sàn bếp."},
    {"tu":"make the bed","loai":"phrase","ipa":"/ˌmeɪk ðə ˈbɛd/","nghia":"dọn giường","viDu":"I make the bed every morning.","dich":"Tôi dọn giường mỗi sáng."},
    {"tu":"take out the trash","loai":"phrase","ipa":"/ˌteɪk aʊt ðə ˈtræʃ/","nghia":"đổ rác","viDu":"Can you take out the trash tonight?","dich":"Tối nay bạn đổ rác được không?"},
    {"tu":"fridge","loai":"noun","ipa":"/frɪdʒ/","nghia":"tủ lạnh","viDu":"The milk is in the fridge.","dich":"Sữa ở trong tủ lạnh."},
    {"tu":"sofa","loai":"noun","ipa":"/ˈsoʊfə/","nghia":"ghế sofa","viDu":"The cat is sleeping on the sofa.","dich":"Con mèo đang ngủ trên ghế sofa."},
    {"tu":"towel","loai":"noun","ipa":"/ˈtaʊəl/","nghia":"khăn tắm","viDu":"Your towel is in the bathroom.","dich":"Khăn tắm của bạn ở trong phòng tắm."},
    {"tu":"pillow","loai":"noun","ipa":"/ˈpɪloʊ/","nghia":"cái gối","viDu":"I need a softer pillow.","dich":"Tôi cần một chiếc gối mềm hơn."},
    {"tu":"key","loai":"noun","ipa":"/ki/","nghia":"chìa khóa","viDu":"I can''t find my house key.","dich":"Tôi không tìm thấy chìa khóa nhà."},
    {"tu":"light","loai":"noun","ipa":"/laɪt/","nghia":"đèn","viDu":"Turn off the light, please.","dich":"Làm ơn tắt đèn."},
    {"tu":"tidy","loai":"adjective","ipa":"/ˈtaɪdi/","nghia":"gọn gàng","viDu":"Her room is always tidy.","dich":"Phòng cô ấy lúc nào cũng gọn gàng."}
  ]},
  {"ten":"Đời sống — Đi chợ và nấu bữa tối","chuDe":"Ẩm thực & nấu ăn","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU",
   "moTa":"Từ vựng khi đi chợ, mua thực phẩm và nấu một bữa tối đơn giản ở nhà.","the":[
    {"tu":"market","loai":"noun","ipa":"/ˈmɑrkɪt/","nghia":"chợ","viDu":"My mother goes to the market every morning.","dich":"Mẹ tôi đi chợ mỗi sáng."},
    {"tu":"vegetable","loai":"noun","ipa":"/ˈvɛdʒtəbəl/","nghia":"rau củ","viDu":"Eat more vegetables.","dich":"Hãy ăn nhiều rau hơn."},
    {"tu":"fresh","loai":"adjective","ipa":"/frɛʃ/","nghia":"tươi","viDu":"This fish is very fresh.","dich":"Con cá này rất tươi."},
    {"tu":"rice","loai":"noun","ipa":"/raɪs/","nghia":"gạo; cơm","viDu":"We eat rice with every meal.","dich":"Chúng tôi ăn cơm trong mọi bữa."},
    {"tu":"chicken","loai":"noun","ipa":"/ˈtʃɪkən/","nghia":"thịt gà","viDu":"I bought some chicken for dinner.","dich":"Tôi đã mua một ít thịt gà cho bữa tối."},
    {"tu":"egg","loai":"noun","ipa":"/ɛɡ/","nghia":"quả trứng","viDu":"Can you buy a dozen eggs?","dich":"Bạn mua giúp một tá trứng được không?"},
    {"tu":"cook","loai":"verb","ipa":"/kʊk/","nghia":"nấu ăn","viDu":"My father cooks on Sundays.","dich":"Bố tôi nấu ăn vào Chủ nhật."},
    {"tu":"boil","loai":"verb","ipa":"/bɔɪl/","nghia":"luộc; đun sôi","viDu":"Boil the water first.","dich":"Đun sôi nước trước."},
    {"tu":"fry","loai":"verb","ipa":"/fraɪ/","nghia":"chiên; rán","viDu":"Fry the eggs in a little oil.","dich":"Chiên trứng với một chút dầu."},
    {"tu":"salty","loai":"adjective","ipa":"/ˈsɔlti/","nghia":"mặn","viDu":"The soup is a little salty.","dich":"Món canh hơi mặn."},
    {"tu":"spicy","loai":"adjective","ipa":"/ˈspaɪsi/","nghia":"cay","viDu":"Do you like spicy food?","dich":"Bạn có thích đồ ăn cay không?"},
    {"tu":"set the table","loai":"phrase","ipa":"/ˌsɛt ðə ˈteɪbəl/","nghia":"dọn bàn ăn","viDu":"Please set the table for four people.","dich":"Làm ơn dọn bàn cho bốn người."}
  ]},
  {"ten":"Đời sống — Đi lại trong thành phố","chuDe":"Giao thông & đi lại","mucTieu":"GIAO_TIEP","trinhDo":"CO_BAN",
   "moTa":"Đi xe buýt, gọi xe, hỏi đường và xử lý khi tắc đường trong thành phố.","the":[
    {"tu":"traffic jam","loai":"noun","ipa":"/ˈtræfɪk ˌdʒæm/","nghia":"tắc đường","viDu":"I was late because of a traffic jam.","dich":"Tôi đến muộn vì bị tắc đường."},
    {"tu":"bus stop","loai":"noun","ipa":"/ˈbʌs ˌstɑp/","nghia":"trạm xe buýt","viDu":"The bus stop is in front of the school.","dich":"Trạm xe buýt ở trước cổng trường."},
    {"tu":"crosswalk","loai":"noun","ipa":"/ˈkrɔsˌwɔk/","nghia":"vạch qua đường","viDu":"Use the crosswalk to cross the street.","dich":"Hãy đi trên vạch qua đường để sang đường."},
    {"tu":"intersection","loai":"noun","ipa":"/ˌɪntərˈsɛkʃən/","nghia":"ngã tư","viDu":"Turn right at the next intersection.","dich":"Rẽ phải ở ngã tư tiếp theo."},
    {"tu":"ride","loai":"verb","ipa":"/raɪd/","nghia":"đi (xe máy, xe đạp)","viDu":"I ride my motorbike to work.","dich":"Tôi đi xe máy đi làm."},
    {"tu":"park","loai":"verb","ipa":"/pɑrk/","nghia":"đỗ xe","viDu":"You can''t park here.","dich":"Bạn không được đỗ xe ở đây."},
    {"tu":"book a ride","loai":"phrase","ipa":"/ˌbʊk ə ˈraɪd/","nghia":"đặt xe (qua ứng dụng)","viDu":"I''ll book a ride to the airport.","dich":"Tôi sẽ đặt xe ra sân bay."},
    {"tu":"get off","loai":"phrasal verb","ipa":"/ˌɡɛt ˈɔf/","nghia":"xuống xe","viDu":"Get off at the third stop.","dich":"Xuống xe ở trạm thứ ba."},
    {"tu":"rush hour","loai":"noun","ipa":"/ˈrʌʃ ˌaʊər/","nghia":"giờ cao điểm","viDu":"The roads are busy during rush hour.","dich":"Đường đông vào giờ cao điểm."},
    {"tu":"helmet","loai":"noun","ipa":"/ˈhɛlmɪt/","nghia":"mũ bảo hiểm","viDu":"Always wear a helmet.","dich":"Luôn đội mũ bảo hiểm."},
    {"tu":"far","loai":"adjective","ipa":"/fɑr/","nghia":"xa","viDu":"Is the station far from here?","dich":"Nhà ga có xa đây không?"},
    {"tu":"on time","loai":"phrase","ipa":"/ɑn ˈtaɪm/","nghia":"đúng giờ","viDu":"The train arrived on time.","dich":"Tàu đến đúng giờ."}
  ]},
  {"ten":"Đời sống — Đi khám và chăm sóc sức khỏe","chuDe":"Sức khỏe & y tế","mucTieu":"GIAO_TIEP","trinhDo":"CO_BAN",
   "moTa":"Nói về triệu chứng, đi khám bác sĩ, mua thuốc và giữ sức khỏe hằng ngày.","the":[
    {"tu":"headache","loai":"noun","ipa":"/ˈhɛdˌeɪk/","nghia":"đau đầu","viDu":"I have a headache today.","dich":"Hôm nay tôi bị đau đầu."},
    {"tu":"fever","loai":"noun","ipa":"/ˈfivər/","nghia":"sốt","viDu":"The baby has a high fever.","dich":"Em bé bị sốt cao."},
    {"tu":"cough","loai":"noun","ipa":"/kɔf/","nghia":"ho","viDu":"This medicine is for your cough.","dich":"Thuốc này để trị ho cho bạn."},
    {"tu":"sore throat","loai":"noun","ipa":"/ˌsɔr ˈθroʊt/","nghia":"đau họng","viDu":"I have a sore throat and a cold.","dich":"Tôi bị đau họng và cảm lạnh."},
    {"tu":"pharmacy","loai":"noun","ipa":"/ˈfɑrməsi/","nghia":"hiệu thuốc","viDu":"The pharmacy closes at nine.","dich":"Hiệu thuốc đóng cửa lúc chín giờ."},
    {"tu":"medicine","loai":"noun","ipa":"/ˈmɛdəsən/","nghia":"thuốc","viDu":"Take this medicine twice a day.","dich":"Uống thuốc này hai lần mỗi ngày."},
    {"tu":"see a doctor","loai":"phrase","ipa":"/ˌsi ə ˈdɑktər/","nghia":"đi khám bác sĩ","viDu":"You should see a doctor.","dich":"Bạn nên đi khám bác sĩ."},
    {"tu":"rest","loai":"verb","ipa":"/rɛst/","nghia":"nghỉ ngơi","viDu":"Stay at home and rest.","dich":"Hãy ở nhà và nghỉ ngơi."},
    {"tu":"exercise","loai":"verb","ipa":"/ˈɛksərˌsaɪz/","nghia":"tập thể dục","viDu":"I exercise for thirty minutes a day.","dich":"Tôi tập thể dục ba mươi phút mỗi ngày."},
    {"tu":"healthy","loai":"adjective","ipa":"/ˈhɛlθi/","nghia":"khỏe mạnh; lành mạnh","viDu":"Fruit is good for a healthy life.","dich":"Trái cây tốt cho một cuộc sống lành mạnh."},
    {"tu":"hurt","loai":"verb","ipa":"/hɜrt/","nghia":"đau; làm đau","viDu":"My leg hurts.","dich":"Chân tôi bị đau."},
    {"tu":"feel better","loai":"phrase","ipa":"/ˌfil ˈbɛtər/","nghia":"thấy khỏe hơn","viDu":"I hope you feel better soon.","dich":"Mong bạn sớm khỏe hơn."}
  ]},
  {"ten":"Đời sống — Cảm xúc hằng ngày","chuDe":"Cảm xúc & tính cách","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU",
   "moTa":"Diễn tả tâm trạng của bạn trong ngày: vui, buồn, lo lắng, hào hứng.","the":[
    {"tu":"excited","loai":"adjective","ipa":"/ɪkˈsaɪtɪd/","nghia":"hào hứng","viDu":"I am excited about the trip.","dich":"Tôi rất hào hứng về chuyến đi."},
    {"tu":"bored","loai":"adjective","ipa":"/bɔrd/","nghia":"chán","viDu":"The kids are bored at home.","dich":"Bọn trẻ thấy chán khi ở nhà."},
    {"tu":"worried","loai":"adjective","ipa":"/ˈwɜrid/","nghia":"lo lắng","viDu":"She is worried about the test.","dich":"Cô ấy lo lắng về bài kiểm tra."},
    {"tu":"angry","loai":"adjective","ipa":"/ˈæŋɡri/","nghia":"tức giận","viDu":"Don''t be angry with me.","dich":"Đừng giận tôi nhé."},
    {"tu":"sad","loai":"adjective","ipa":"/sæd/","nghia":"buồn","viDu":"He looks sad today.","dich":"Hôm nay anh ấy trông buồn."},
    {"tu":"relaxed","loai":"adjective","ipa":"/rɪˈlækst/","nghia":"thư thái","viDu":"I feel relaxed after a hot bath.","dich":"Tôi thấy thư thái sau khi tắm nước nóng."},
    {"tu":"nervous","loai":"adjective","ipa":"/ˈnɜrvəs/","nghia":"hồi hộp","viDu":"I was nervous before the interview.","dich":"Tôi đã hồi hộp trước buổi phỏng vấn."},
    {"tu":"proud","loai":"adjective","ipa":"/praʊd/","nghia":"tự hào","viDu":"My parents are proud of me.","dich":"Bố mẹ tự hào về tôi."},
    {"tu":"surprised","loai":"adjective","ipa":"/sərˈpraɪzd/","nghia":"ngạc nhiên","viDu":"I was surprised by the gift.","dich":"Tôi ngạc nhiên vì món quà."},
    {"tu":"lonely","loai":"adjective","ipa":"/ˈloʊnli/","nghia":"cô đơn","viDu":"He feels lonely in the new city.","dich":"Anh ấy thấy cô đơn ở thành phố mới."}
  ]},
  {"ten":"Đời sống — Thời tiết và các mùa","chuDe":"Môi trường & thời tiết","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU",
   "moTa":"Hỏi và nói về thời tiết hôm nay, các mùa trong năm và cách chuẩn bị khi ra ngoài.","the":[
    {"tu":"sunny","loai":"adjective","ipa":"/ˈsʌni/","nghia":"nắng","viDu":"It is sunny this morning.","dich":"Sáng nay trời nắng."},
    {"tu":"rainy","loai":"adjective","ipa":"/ˈreɪni/","nghia":"có mưa","viDu":"I stay home on rainy days.","dich":"Tôi ở nhà vào những ngày mưa."},
    {"tu":"cloudy","loai":"adjective","ipa":"/ˈklaʊdi/","nghia":"nhiều mây","viDu":"The sky is cloudy.","dich":"Bầu trời nhiều mây."},
    {"tu":"windy","loai":"adjective","ipa":"/ˈwɪndi/","nghia":"có gió","viDu":"It is too windy to ride a bike.","dich":"Trời gió quá nên không đạp xe được."},
    {"tu":"humid","loai":"adjective","ipa":"/ˈhjumɪd/","nghia":"ẩm ướt; oi","viDu":"Summer here is hot and humid.","dich":"Mùa hè ở đây nóng và oi."},
    {"tu":"umbrella","loai":"noun","ipa":"/ʌmˈbrɛlə/","nghia":"cái ô","viDu":"Take an umbrella with you.","dich":"Mang theo ô nhé."},
    {"tu":"season","loai":"noun","ipa":"/ˈsizən/","nghia":"mùa","viDu":"Autumn is my favorite season.","dich":"Mùa thu là mùa tôi thích nhất."},
    {"tu":"temperature","loai":"noun","ipa":"/ˈtɛmprətʃər/","nghia":"nhiệt độ","viDu":"The temperature is thirty degrees.","dich":"Nhiệt độ là ba mươi độ."},
    {"tu":"storm","loai":"noun","ipa":"/stɔrm/","nghia":"cơn bão","viDu":"A storm is coming tonight.","dich":"Tối nay sẽ có bão."},
    {"tu":"forecast","loai":"noun","ipa":"/ˈfɔrˌkæst/","nghia":"dự báo thời tiết","viDu":"Check the forecast before you go.","dich":"Xem dự báo thời tiết trước khi đi."}
  ]},
  {"ten":"Đời sống — Cuối tuần và sở thích","chuDe":"Sở thích & thời gian rảnh","mucTieu":"GIAO_TIEP","trinhDo":"CO_BAN",
   "moTa":"Kể về những việc bạn làm cuối tuần, rủ bạn bè đi chơi và nói về sở thích.","the":[
    {"tu":"hang out","loai":"phrasal verb","ipa":"/ˌhæŋ ˈaʊt/","nghia":"đi chơi","viDu":"Let''s hang out this weekend.","dich":"Cuối tuần này đi chơi nhé."},
    {"tu":"watch a movie","loai":"phrase","ipa":"/ˌwɑtʃ ə ˈmuvi/","nghia":"xem phim","viDu":"We watch a movie on Friday night.","dich":"Chúng tôi xem phim vào tối thứ Sáu."},
    {"tu":"go jogging","loai":"phrase","ipa":"/ˌɡoʊ ˈdʒɑɡɪŋ/","nghia":"đi chạy bộ","viDu":"I go jogging in the park.","dich":"Tôi đi chạy bộ trong công viên."},
    {"tu":"read","loai":"verb","ipa":"/rid/","nghia":"đọc","viDu":"She reads before bed.","dich":"Cô ấy đọc sách trước khi ngủ."},
    {"tu":"play games","loai":"phrase","ipa":"/ˌpleɪ ˈɡeɪmz/","nghia":"chơi trò chơi","viDu":"My brother and I play games online.","dich":"Em trai và tôi chơi trò chơi trực tuyến."},
    {"tu":"go shopping","loai":"phrase","ipa":"/ˌɡoʊ ˈʃɑpɪŋ/","nghia":"đi mua sắm","viDu":"We go shopping at the mall.","dich":"Chúng tôi đi mua sắm ở trung tâm thương mại."},
    {"tu":"sleep in","loai":"phrasal verb","ipa":"/ˌslip ˈɪn/","nghia":"ngủ nướng","viDu":"I sleep in on Sunday.","dich":"Tôi ngủ nướng vào Chủ nhật."},
    {"tu":"visit","loai":"verb","ipa":"/ˈvɪzɪt/","nghia":"thăm","viDu":"We visit our grandparents every month.","dich":"Chúng tôi thăm ông bà mỗi tháng."},
    {"tu":"picnic","loai":"noun","ipa":"/ˈpɪknɪk/","nghia":"buổi dã ngoại","viDu":"Let''s have a picnic by the lake.","dich":"Mình đi dã ngoại bên hồ nhé."},
    {"tu":"take photos","loai":"phrase","ipa":"/ˌteɪk ˈfoʊtoʊz/","nghia":"chụp ảnh","viDu":"He loves to take photos of the sea.","dich":"Anh ấy thích chụp ảnh biển."},
    {"tu":"cafe","loai":"noun","ipa":"/kæˈfeɪ/","nghia":"quán cà phê","viDu":"Let''s meet at the cafe near my house.","dich":"Gặp nhau ở quán cà phê gần nhà tôi nhé."},
    {"tu":"free","loai":"adjective","ipa":"/fri/","nghia":"rảnh","viDu":"Are you free on Saturday?","dich":"Thứ Bảy bạn có rảnh không?"}
  ]}
]';

INSERT INTO bo_the (chu_so_huu_id, chu_de_id, ten, mo_ta, trinh_do, muc_tieu, quyen_truy_cap, trang_thai_kiem_duyet, bo_mau)
SELECT @daily_author, topic.id, catalog.ten, catalog.mo_ta, catalog.trinh_do, catalog.muc_tieu, 'CONG_KHAI', 'BINH_THUONG', TRUE
FROM JSON_TABLE(@daily_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    chu_de VARCHAR(100) PATH '$.chuDe',
    mo_ta VARCHAR(500) PATH '$.moTa',
    trinh_do VARCHAR(20) PATH '$.trinhDo',
    muc_tieu VARCHAR(20) PATH '$.mucTieu'
)) catalog
LEFT JOIN chu_de topic ON topic.ten = catalog.chu_de
WHERE NOT EXISTS (
    SELECT 1 FROM bo_the existing
    WHERE existing.chu_so_huu_id = @daily_author AND existing.ten = catalog.ten AND existing.xoa_at IS NULL
);

UPDATE bo_the deck
JOIN JSON_TABLE(@daily_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    chu_de VARCHAR(100) PATH '$.chuDe',
    mo_ta VARCHAR(500) PATH '$.moTa'
)) catalog ON deck.ten = catalog.ten
LEFT JOIN chu_de topic ON topic.ten = catalog.chu_de
SET deck.mo_ta = catalog.mo_ta, deck.chu_de_id = topic.id, deck.updated_at = @daily_now
WHERE deck.chu_so_huu_id = @daily_author AND deck.xoa_at IS NULL
  AND NOT (deck.mo_ta <=> catalog.mo_ta AND deck.chu_de_id <=> topic.id);

INSERT INTO the_tu_vung (bo_the_id, tu, tu_loai, nghia_vi, phien_am, vi_du_en, dich_vi, do_kho, nguon)
SELECT deck.id, catalog.tu, catalog.tu_loai, catalog.nghia, catalog.phien_am, catalog.vi_du, catalog.dich,
       CASE deck.trinh_do WHEN 'MOI_BAT_DAU' THEN 1 ELSE 2 END,
       @daily_source
FROM JSON_TABLE(@daily_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    NESTED PATH '$.the[*]' COLUMNS (
        tu VARCHAR(100) PATH '$.tu',
        tu_loai VARCHAR(30) PATH '$.loai',
        phien_am VARCHAR(100) PATH '$.ipa',
        nghia VARCHAR(500) PATH '$.nghia',
        vi_du VARCHAR(300) PATH '$.viDu',
        dich VARCHAR(300) PATH '$.dich'
    )
)) catalog
JOIN bo_the deck ON deck.chu_so_huu_id = @daily_author AND deck.ten = catalog.ten AND deck.xoa_at IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM the_tu_vung existing
    WHERE existing.bo_the_id = deck.id AND existing.tu = catalog.tu
);
