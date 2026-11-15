INSERT INTO nguoi_dung (email, ten_hien_thi, trang_thai, password_hash)
VALUES ('library-editor@vocab.local', 'VocabLearning', 'BI_KHOA', NULL)
ON DUPLICATE KEY UPDATE email = email;

SET @library_author = (SELECT id FROM nguoi_dung WHERE email = 'library-editor@vocab.local');
SET @library_now = UTC_TIMESTAMP(3);
SET @library_source = 'VocabLearning — thư viện mẫu tự biên soạn, đã duyệt tay';

SET @library_catalog = '[
  {"ten":"Giao tiếp mới bắt đầu — Chào hỏi và sinh hoạt hằng ngày","cu":"Khởi động — Giao tiếp mới bắt đầu","mucTieu":"GIAO_TIEP","trinhDo":"MOI_BAT_DAU",
   "moTa":"30 từ và cụm từ đầu tiên để chào hỏi, nói về gia đình, bữa ăn, thời gian và thời tiết.","the":[
    {"tu":"hello","loai":"interjection","ipa":"/həˈloʊ/","nghia":"xin chào","viDu":"Hello, my name is An.","dich":"Xin chào, tôi tên là An."},
    {"tu":"thank you","loai":"phrase","ipa":"/ˈθæŋk ju/","nghia":"cảm ơn","viDu":"Thank you for your help.","dich":"Cảm ơn bạn đã giúp đỡ."},
    {"tu":"please","loai":"adverb","ipa":"/pliz/","nghia":"làm ơn; vui lòng","viDu":"Please sit here.","dich":"Vui lòng ngồi ở đây."},
    {"tu":"goodbye","loai":"interjection","ipa":"/ɡʊdˈbaɪ/","nghia":"tạm biệt","viDu":"She said goodbye and left the room.","dich":"Cô ấy nói lời tạm biệt rồi rời khỏi phòng."},
    {"tu":"sorry","loai":"adjective","ipa":"/ˈsɑri/","nghia":"xin lỗi; lấy làm tiếc","viDu":"I am sorry for being late.","dich":"Tôi xin lỗi vì đến muộn."},
    {"tu":"excuse me","loai":"phrase","ipa":"/ɪkˈskjuz mi/","nghia":"xin lỗi (khi muốn hỏi hoặc làm phiền)","viDu":"Excuse me, where is the bus stop?","dich":"Xin lỗi, trạm xe buýt ở đâu?"},
    {"tu":"morning","loai":"noun","ipa":"/ˈmɔrnɪŋ/","nghia":"buổi sáng","viDu":"I drink coffee every morning.","dich":"Tôi uống cà phê mỗi buổi sáng."},
    {"tu":"friend","loai":"noun","ipa":"/frɛnd/","nghia":"bạn bè","viDu":"My best friend lives near my house.","dich":"Bạn thân của tôi sống gần nhà tôi."},
    {"tu":"family","loai":"noun","ipa":"/ˈfæməli/","nghia":"gia đình","viDu":"I have dinner with my family on Sunday.","dich":"Tôi ăn tối với gia đình vào Chủ nhật."},
    {"tu":"name","loai":"noun","ipa":"/neɪm/","nghia":"tên","viDu":"What is your name?","dich":"Bạn tên là gì?"},
    {"tu":"water","loai":"noun","ipa":"/ˈwɔtər/","nghia":"nước","viDu":"Can I have a glass of water?","dich":"Cho tôi một ly nước được không?"},
    {"tu":"breakfast","loai":"noun","ipa":"/ˈbrɛkfəst/","nghia":"bữa sáng","viDu":"We usually eat breakfast at seven.","dich":"Chúng tôi thường ăn sáng lúc bảy giờ."},
    {"tu":"dinner","loai":"noun","ipa":"/ˈdɪnər/","nghia":"bữa tối","viDu":"Dinner is ready.","dich":"Bữa tối đã sẵn sàng."},
    {"tu":"today","loai":"adverb","ipa":"/təˈdeɪ/","nghia":"hôm nay","viDu":"It is very hot today.","dich":"Hôm nay trời rất nóng."},
    {"tu":"tomorrow","loai":"adverb","ipa":"/təˈmɑroʊ/","nghia":"ngày mai","viDu":"See you tomorrow.","dich":"Hẹn gặp bạn ngày mai."},
    {"tu":"weekend","loai":"noun","ipa":"/ˈwikˌɛnd/","nghia":"cuối tuần","viDu":"What do you do on the weekend?","dich":"Bạn làm gì vào cuối tuần?"},
    {"tu":"house","loai":"noun","ipa":"/haʊs/","nghia":"ngôi nhà","viDu":"Their house has a small garden.","dich":"Nhà của họ có một khu vườn nhỏ."},
    {"tu":"kitchen","loai":"noun","ipa":"/ˈkɪtʃən/","nghia":"nhà bếp","viDu":"My mother is cooking in the kitchen.","dich":"Mẹ tôi đang nấu ăn trong bếp."},
    {"tu":"phone","loai":"noun","ipa":"/foʊn/","nghia":"điện thoại","viDu":"Turn off your phone in the cinema.","dich":"Hãy tắt điện thoại trong rạp chiếu phim."},
    {"tu":"help","loai":"verb","ipa":"/hɛlp/","nghia":"giúp đỡ","viDu":"Can you help me carry this bag?","dich":"Bạn có thể giúp tôi mang chiếc túi này không?"},
    {"tu":"welcome","loai":"interjection","ipa":"/ˈwɛlkəm/","nghia":"chào mừng","viDu":"Welcome to our home!","dich":"Chào mừng bạn đến nhà chúng tôi!"},
    {"tu":"hungry","loai":"adjective","ipa":"/ˈhʌŋɡri/","nghia":"đói","viDu":"I am hungry. Can we eat now?","dich":"Tôi đói rồi. Mình ăn ngay được không?"},
    {"tu":"tired","loai":"adjective","ipa":"/ˈtaɪərd/","nghia":"mệt","viDu":"He is tired after work.","dich":"Anh ấy mệt sau giờ làm."},
    {"tu":"happy","loai":"adjective","ipa":"/ˈhæpi/","nghia":"vui vẻ; hạnh phúc","viDu":"She looks happy today.","dich":"Hôm nay cô ấy trông vui vẻ."},
    {"tu":"cheap","loai":"adjective","ipa":"/tʃip/","nghia":"rẻ","viDu":"This shirt is cheap but nice.","dich":"Chiếc áo này rẻ nhưng đẹp."},
    {"tu":"expensive","loai":"adjective","ipa":"/ɪkˈspɛnsɪv/","nghia":"đắt","viDu":"The hotel is too expensive for us.","dich":"Khách sạn này quá đắt đối với chúng tôi."},
    {"tu":"early","loai":"adverb","ipa":"/ˈɜrli/","nghia":"sớm","viDu":"I get up early on weekdays.","dich":"Tôi dậy sớm vào các ngày trong tuần."},
    {"tu":"late","loai":"adjective","ipa":"/leɪt/","nghia":"muộn; trễ","viDu":"Sorry, the train is late.","dich":"Xin lỗi, tàu đến trễ."},
    {"tu":"weather","loai":"noun","ipa":"/ˈwɛðər/","nghia":"thời tiết","viDu":"The weather is nice this afternoon.","dich":"Chiều nay thời tiết đẹp."},
    {"tu":"neighbor","loai":"noun","ipa":"/ˈneɪbər/","nghia":"hàng xóm","viDu":"Our neighbor has a friendly dog.","dich":"Nhà hàng xóm của chúng tôi có một chú chó thân thiện."}
  ]},
  {"ten":"Giao tiếp cơ bản — Hẹn gặp, hỏi đường và mua sắm","cu":"Khởi động — Giao tiếp cơ bản","mucTieu":"GIAO_TIEP","trinhDo":"CO_BAN",
   "moTa":"Từ vựng để hẹn lịch, hỏi đường, gọi món, mua sắm và đi lại trong thành phố.","the":[
    {"tu":"appointment","loai":"noun","ipa":"/əˈpɔɪntmənt/","nghia":"cuộc hẹn","viDu":"I have an appointment at ten.","dich":"Tôi có một cuộc hẹn lúc mười giờ."},
    {"tu":"directions","loai":"noun","ipa":"/dəˈrɛkʃənz/","nghia":"chỉ dẫn đường đi","viDu":"Could you give me directions to the station?","dich":"Bạn có thể chỉ đường đến nhà ga cho tôi không?"},
    {"tu":"available","loai":"adjective","ipa":"/əˈveɪləbəl/","nghia":"có sẵn; rảnh","viDu":"Are you available tomorrow?","dich":"Ngày mai bạn có rảnh không?"},
    {"tu":"recommend","loai":"verb","ipa":"/ˌrɛkəˈmɛnd/","nghia":"giới thiệu; gợi ý","viDu":"Can you recommend a good restaurant?","dich":"Bạn có thể gợi ý một nhà hàng ngon không?"},
    {"tu":"menu","loai":"noun","ipa":"/ˈmɛnju/","nghia":"thực đơn","viDu":"Could we see the menu, please?","dich":"Cho chúng tôi xem thực đơn được không?"},
    {"tu":"bill","loai":"noun","ipa":"/bɪl/","nghia":"hóa đơn thanh toán","viDu":"Can we have the bill, please?","dich":"Cho chúng tôi xin hóa đơn."},
    {"tu":"change","loai":"noun","ipa":"/tʃeɪndʒ/","nghia":"tiền thối lại","viDu":"Here is your change.","dich":"Đây là tiền thối của bạn."},
    {"tu":"discount","loai":"noun","ipa":"/ˈdɪskaʊnt/","nghia":"sự giảm giá","viDu":"Is there a discount for students?","dich":"Có giảm giá cho sinh viên không?"},
    {"tu":"receipt","loai":"noun","ipa":"/rɪˈsit/","nghia":"biên lai","viDu":"May I have a receipt?","dich":"Cho tôi xin biên lai được không?"},
    {"tu":"size","loai":"noun","ipa":"/saɪz/","nghia":"kích cỡ","viDu":"Do you have this in a larger size?","dich":"Bạn có cỡ lớn hơn của cái này không?"},
    {"tu":"try on","loai":"phrasal verb","ipa":"/ˌtraɪ ˈɑn/","nghia":"mặc thử; đi thử","viDu":"Can I try on these shoes?","dich":"Tôi có thể đi thử đôi giày này không?"},
    {"tu":"corner","loai":"noun","ipa":"/ˈkɔrnər/","nghia":"góc phố","viDu":"The bank is on the corner.","dich":"Ngân hàng nằm ở góc phố."},
    {"tu":"straight","loai":"adverb","ipa":"/streɪt/","nghia":"thẳng","viDu":"Go straight for two blocks.","dich":"Đi thẳng qua hai dãy nhà."},
    {"tu":"turn left","loai":"phrase","ipa":"/ˌtɜrn ˈlɛft/","nghia":"rẽ trái","viDu":"Turn left at the traffic lights.","dich":"Rẽ trái ở đèn giao thông."},
    {"tu":"nearby","loai":"adverb","ipa":"/ˌnɪrˈbaɪ/","nghia":"ở gần đây","viDu":"Is there a pharmacy nearby?","dich":"Gần đây có hiệu thuốc nào không?"},
    {"tu":"plan","loai":"verb","ipa":"/plæn/","nghia":"dự định; lên kế hoạch","viDu":"We plan to visit Hue next month.","dich":"Chúng tôi dự định thăm Huế vào tháng tới."},
    {"tu":"invite","loai":"verb","ipa":"/ɪnˈvaɪt/","nghia":"mời","viDu":"I want to invite you to my party.","dich":"Tôi muốn mời bạn đến bữa tiệc của tôi."},
    {"tu":"cancel","loai":"verb","ipa":"/ˈkænsəl/","nghia":"hủy","viDu":"I need to cancel our lunch today.","dich":"Tôi cần hủy bữa trưa của chúng ta hôm nay."},
    {"tu":"postpone","loai":"verb","ipa":"/poʊstˈpoʊn/","nghia":"hoãn lại","viDu":"Can we postpone the trip until Friday?","dich":"Chúng ta có thể hoãn chuyến đi đến thứ Sáu không?"},
    {"tu":"busy","loai":"adjective","ipa":"/ˈbɪzi/","nghia":"bận","viDu":"I am busy this morning.","dich":"Sáng nay tôi bận."},
    {"tu":"free time","loai":"noun","ipa":"/ˌfri ˈtaɪm/","nghia":"thời gian rảnh","viDu":"What do you do in your free time?","dich":"Bạn làm gì vào thời gian rảnh?"},
    {"tu":"hobby","loai":"noun","ipa":"/ˈhɑbi/","nghia":"sở thích","viDu":"My hobby is taking photos.","dich":"Sở thích của tôi là chụp ảnh."},
    {"tu":"borrow","loai":"verb","ipa":"/ˈbɑroʊ/","nghia":"mượn","viDu":"Can I borrow your pen?","dich":"Tôi mượn bút của bạn được không?"},
    {"tu":"order","loai":"verb","ipa":"/ˈɔrdər/","nghia":"gọi món; đặt hàng","viDu":"I would like to order a coffee.","dich":"Tôi muốn gọi một ly cà phê."},
    {"tu":"delicious","loai":"adjective","ipa":"/dɪˈlɪʃəs/","nghia":"ngon","viDu":"This soup is delicious.","dich":"Món súp này ngon quá."},
    {"tu":"fare","loai":"noun","ipa":"/fɛr/","nghia":"giá vé (xe, tàu)","viDu":"How much is the bus fare?","dich":"Giá vé xe buýt là bao nhiêu?"},
    {"tu":"platform","loai":"noun","ipa":"/ˈplætˌfɔrm/","nghia":"sân ga","viDu":"The train leaves from platform two.","dich":"Tàu khởi hành từ sân ga số hai."},
    {"tu":"luggage","loai":"noun","ipa":"/ˈlʌɡɪdʒ/","nghia":"hành lý","viDu":"Please watch your luggage.","dich":"Vui lòng trông chừng hành lý của bạn."},
    {"tu":"souvenir","loai":"noun","ipa":"/ˌsuvəˈnɪr/","nghia":"quà lưu niệm","viDu":"I bought a souvenir for my sister.","dich":"Tôi đã mua một món quà lưu niệm cho em gái."},
    {"tu":"lost","loai":"adjective","ipa":"/lɔst/","nghia":"bị lạc","viDu":"I think we are lost.","dich":"Tôi nghĩ chúng ta bị lạc rồi."}
  ]},
  {"ten":"Giao tiếp trung cấp — Trao đổi ý kiến và giải quyết vấn đề","cu":"Khởi động — Giao tiếp trung cấp","mucTieu":"GIAO_TIEP","trinhDo":"TRUNG_CAP",
   "moTa":"Từ vựng để nêu ý kiến, đồng ý hoặc phản đối, xin lỗi, thuyết phục và tìm giải pháp.","the":[
    {"tu":"clarify","loai":"verb","ipa":"/ˈklɛrəˌfaɪ/","nghia":"làm rõ","viDu":"Could you clarify your suggestion?","dich":"Bạn có thể làm rõ đề xuất của mình không?"},
    {"tu":"compromise","loai":"noun","ipa":"/ˈkɑmprəˌmaɪz/","nghia":"sự thỏa hiệp","viDu":"We reached a compromise.","dich":"Chúng tôi đã đạt được một thỏa hiệp."},
    {"tu":"perspective","loai":"noun","ipa":"/pərˈspɛktɪv/","nghia":"góc nhìn; quan điểm","viDu":"I understand your perspective.","dich":"Tôi hiểu quan điểm của bạn."},
    {"tu":"opinion","loai":"noun","ipa":"/əˈpɪnjən/","nghia":"ý kiến","viDu":"In my opinion, the plan is too risky.","dich":"Theo ý kiến của tôi, kế hoạch quá rủi ro."},
    {"tu":"agree","loai":"verb","ipa":"/əˈɡri/","nghia":"đồng ý","viDu":"I agree with your idea.","dich":"Tôi đồng ý với ý tưởng của bạn."},
    {"tu":"disagree","loai":"verb","ipa":"/ˌdɪsəˈɡri/","nghia":"không đồng ý","viDu":"I disagree with that decision.","dich":"Tôi không đồng ý với quyết định đó."},
    {"tu":"suggest","loai":"verb","ipa":"/səɡˈdʒɛst/","nghia":"đề nghị; gợi ý","viDu":"I suggest that we leave early.","dich":"Tôi đề nghị chúng ta đi sớm."},
    {"tu":"explain","loai":"verb","ipa":"/ɪkˈspleɪn/","nghia":"giải thích","viDu":"Could you explain the rules again?","dich":"Bạn có thể giải thích lại luật không?"},
    {"tu":"misunderstand","loai":"verb","ipa":"/ˌmɪsʌndərˈstænd/","nghia":"hiểu lầm","viDu":"Please do not misunderstand me.","dich":"Xin đừng hiểu lầm tôi."},
    {"tu":"solution","loai":"noun","ipa":"/səˈluʃən/","nghia":"giải pháp","viDu":"We need a quick solution to this problem.","dich":"Chúng ta cần một giải pháp nhanh cho vấn đề này."},
    {"tu":"issue","loai":"noun","ipa":"/ˈɪʃu/","nghia":"vấn đề","viDu":"The main issue is the cost.","dich":"Vấn đề chính là chi phí."},
    {"tu":"complain","loai":"verb","ipa":"/kəmˈpleɪn/","nghia":"phàn nàn","viDu":"Customers often complain about the noise.","dich":"Khách hàng thường phàn nàn về tiếng ồn."},
    {"tu":"apologize","loai":"verb","ipa":"/əˈpɑləˌdʒaɪz/","nghia":"xin lỗi","viDu":"I want to apologize for my mistake.","dich":"Tôi muốn xin lỗi vì lỗi của mình."},
    {"tu":"convince","loai":"verb","ipa":"/kənˈvɪns/","nghia":"thuyết phục","viDu":"She tried to convince her parents.","dich":"Cô ấy cố thuyết phục bố mẹ."},
    {"tu":"reasonable","loai":"adjective","ipa":"/ˈrizənəbəl/","nghia":"hợp lý","viDu":"That sounds like a reasonable price.","dich":"Nghe có vẻ là một mức giá hợp lý."},
    {"tu":"confident","loai":"adjective","ipa":"/ˈkɑnfədənt/","nghia":"tự tin","viDu":"He feels confident before the interview.","dich":"Anh ấy cảm thấy tự tin trước buổi phỏng vấn."},
    {"tu":"frustrated","loai":"adjective","ipa":"/ˈfrʌˌstreɪtɪd/","nghia":"bực bội; nản lòng","viDu":"I was frustrated by the long delay.","dich":"Tôi bực bội vì sự chậm trễ kéo dài."},
    {"tu":"encourage","loai":"verb","ipa":"/ɪnˈkɜrɪdʒ/","nghia":"khuyến khích","viDu":"Teachers encourage students to ask questions.","dich":"Giáo viên khuyến khích học sinh đặt câu hỏi."},
    {"tu":"negotiate","loai":"verb","ipa":"/nɪˈɡoʊʃiˌeɪt/","nghia":"thương lượng","viDu":"We need to negotiate a better deal.","dich":"Chúng ta cần thương lượng một thỏa thuận tốt hơn."},
    {"tu":"feedback","loai":"noun","ipa":"/ˈfidˌbæk/","nghia":"ý kiến phản hồi","viDu":"Thanks for your helpful feedback.","dich":"Cảm ơn ý kiến phản hồi hữu ích của bạn."},
    {"tu":"priority","loai":"noun","ipa":"/praɪˈɔrəti/","nghia":"sự ưu tiên","viDu":"Safety is our top priority.","dich":"An toàn là ưu tiên hàng đầu của chúng tôi."},
    {"tu":"assume","loai":"verb","ipa":"/əˈsum/","nghia":"cho rằng; giả định","viDu":"Do not assume that everyone knows the answer.","dich":"Đừng cho rằng ai cũng biết câu trả lời."},
    {"tu":"mention","loai":"verb","ipa":"/ˈmɛnʃən/","nghia":"đề cập","viDu":"Did he mention the meeting time?","dich":"Anh ấy có đề cập giờ họp không?"},
    {"tu":"respond","loai":"verb","ipa":"/rɪˈspɑnd/","nghia":"phản hồi; trả lời","viDu":"Please respond to my message soon.","dich":"Vui lòng sớm trả lời tin nhắn của tôi."},
    {"tu":"argue","loai":"verb","ipa":"/ˈɑrɡju/","nghia":"tranh cãi","viDu":"They argue about money all the time.","dich":"Họ lúc nào cũng tranh cãi về tiền."},
    {"tu":"consider","loai":"verb","ipa":"/kənˈsɪdər/","nghia":"cân nhắc","viDu":"Please consider my offer.","dich":"Vui lòng cân nhắc đề nghị của tôi."},
    {"tu":"realistic","loai":"adjective","ipa":"/ˌriəˈlɪstɪk/","nghia":"thực tế","viDu":"Set a realistic goal for this month.","dich":"Hãy đặt một mục tiêu thực tế cho tháng này."},
    {"tu":"efficient","loai":"adjective","ipa":"/ɪˈfɪʃənt/","nghia":"hiệu quả","viDu":"This is an efficient way to learn words.","dich":"Đây là một cách học từ hiệu quả."},
    {"tu":"regret","loai":"verb","ipa":"/rɪˈɡrɛt/","nghia":"hối tiếc","viDu":"I regret not studying harder.","dich":"Tôi hối tiếc vì đã không học chăm hơn."},
    {"tu":"rely on","loai":"phrasal verb","ipa":"/rɪˈlaɪ ɑn/","nghia":"dựa vào; tin cậy","viDu":"You can rely on me.","dich":"Bạn có thể tin cậy tôi."}
  ]},
  {"ten":"Giao tiếp nâng cao — Thuyết phục và diễn đạt tinh tế","cu":"Khởi động — Giao tiếp nâng cao","mucTieu":"GIAO_TIEP","trinhDo":"NANG_CAO",
   "moTa":"Từ vựng để tranh luận, thuyết phục, nhấn mạnh và diễn đạt sắc thái trong thảo luận.","the":[
    {"tu":"nuance","loai":"noun","ipa":"/ˈnuˌɑns/","nghia":"sắc thái khác biệt tinh tế","viDu":"The translation misses an important nuance.","dich":"Bản dịch bỏ sót một sắc thái quan trọng."},
    {"tu":"articulate","loai":"verb","ipa":"/ɑrˈtɪkjəˌleɪt/","nghia":"diễn đạt rõ ràng","viDu":"She articulated her concerns clearly.","dich":"Cô ấy diễn đạt rõ những điều mình lo ngại."},
    {"tu":"reconcile","loai":"verb","ipa":"/ˈrɛkənˌsaɪl/","nghia":"dung hòa; hòa giải","viDu":"We need to reconcile these different views.","dich":"Chúng ta cần dung hòa những quan điểm khác nhau này."},
    {"tu":"eloquent","loai":"adjective","ipa":"/ˈɛləkwənt/","nghia":"hùng hồn; có tài diễn thuyết","viDu":"She gave an eloquent speech.","dich":"Cô ấy có một bài phát biểu hùng hồn."},
    {"tu":"persuasive","loai":"adjective","ipa":"/pərˈsweɪsɪv/","nghia":"có sức thuyết phục","viDu":"His argument was very persuasive.","dich":"Lập luận của anh ấy rất thuyết phục."},
    {"tu":"ambiguous","loai":"adjective","ipa":"/æmˈbɪɡjuəs/","nghia":"mơ hồ; nước đôi","viDu":"The instructions were ambiguous.","dich":"Hướng dẫn rất mơ hồ."},
    {"tu":"implication","loai":"noun","ipa":"/ˌɪmpləˈkeɪʃən/","nghia":"hàm ý; hệ quả","viDu":"Think about the implications of your choice.","dich":"Hãy nghĩ về hệ quả của lựa chọn của bạn."},
    {"tu":"diplomatic","loai":"adjective","ipa":"/ˌdɪpləˈmætɪk/","nghia":"khéo léo trong ứng xử","viDu":"Try to be diplomatic when you refuse.","dich":"Hãy cố khéo léo khi bạn từ chối."},
    {"tu":"tactful","loai":"adjective","ipa":"/ˈtæktfəl/","nghia":"tế nhị","viDu":"It was tactful of you not to mention it.","dich":"Bạn thật tế nhị khi không nhắc đến chuyện đó."},
    {"tu":"concede","loai":"verb","ipa":"/kənˈsid/","nghia":"thừa nhận (một cách miễn cưỡng)","viDu":"I concede that you were right.","dich":"Tôi thừa nhận rằng bạn đã đúng."},
    {"tu":"elaborate","loai":"verb","ipa":"/ɪˈlæbəˌreɪt/","nghia":"trình bày chi tiết","viDu":"Could you elaborate on that point?","dich":"Bạn có thể nói rõ hơn về điểm đó không?"},
    {"tu":"rebuttal","loai":"noun","ipa":"/rɪˈbʌtəl/","nghia":"lời phản bác","viDu":"Her rebuttal was short and clear.","dich":"Lời phản bác của cô ấy ngắn gọn và rõ ràng."},
    {"tu":"consensus","loai":"noun","ipa":"/kənˈsɛnsəs/","nghia":"sự đồng thuận","viDu":"The team finally reached a consensus.","dich":"Cả nhóm cuối cùng đã đạt được sự đồng thuận."},
    {"tu":"skeptical","loai":"adjective","ipa":"/ˈskɛptɪkəl/","nghia":"hoài nghi","viDu":"Many people are skeptical about the plan.","dich":"Nhiều người hoài nghi về kế hoạch."},
    {"tu":"empathy","loai":"noun","ipa":"/ˈɛmpəθi/","nghia":"sự đồng cảm","viDu":"Good leaders show empathy.","dich":"Nhà lãnh đạo giỏi thể hiện sự đồng cảm."},
    {"tu":"candid","loai":"adjective","ipa":"/ˈkændɪd/","nghia":"thẳng thắn","viDu":"Thank you for your candid answer.","dich":"Cảm ơn câu trả lời thẳng thắn của bạn."},
    {"tu":"subtle","loai":"adjective","ipa":"/ˈsʌtəl/","nghia":"tinh tế; khó nhận ra","viDu":"There is a subtle difference between the two words.","dich":"Có một khác biệt tinh tế giữa hai từ."},
    {"tu":"undermine","loai":"verb","ipa":"/ˌʌndərˈmaɪn/","nghia":"làm suy yếu","viDu":"Rumors can undermine trust.","dich":"Tin đồn có thể làm suy yếu lòng tin."},
    {"tu":"acknowledge","loai":"verb","ipa":"/əkˈnɑlɪdʒ/","nghia":"thừa nhận; ghi nhận","viDu":"We acknowledge your hard work.","dich":"Chúng tôi ghi nhận sự chăm chỉ của bạn."},
    {"tu":"digress","loai":"verb","ipa":"/daɪˈɡrɛs/","nghia":"lạc đề","viDu":"Sorry, I digress. Back to the main topic.","dich":"Xin lỗi, tôi lạc đề. Quay lại chủ đề chính nhé."},
    {"tu":"emphasize","loai":"verb","ipa":"/ˈɛmfəˌsaɪz/","nghia":"nhấn mạnh","viDu":"I want to emphasize one point.","dich":"Tôi muốn nhấn mạnh một điểm."},
    {"tu":"inevitable","loai":"adjective","ipa":"/ɪˈnɛvɪtəbəl/","nghia":"không thể tránh khỏi","viDu":"Some changes are inevitable.","dich":"Một số thay đổi là không thể tránh khỏi."},
    {"tu":"coherent","loai":"adjective","ipa":"/koʊˈhɪrənt/","nghia":"mạch lạc","viDu":"Write a coherent paragraph.","dich":"Hãy viết một đoạn văn mạch lạc."},
    {"tu":"compelling","loai":"adjective","ipa":"/kəmˈpɛlɪŋ/","nghia":"đầy sức thuyết phục","viDu":"She made a compelling case for change.","dich":"Cô ấy đưa ra lý lẽ đầy thuyết phục cho sự thay đổi."},
    {"tu":"refute","loai":"verb","ipa":"/rɪˈfjut/","nghia":"bác bỏ","viDu":"He tried to refute the claim with data.","dich":"Anh ấy cố bác bỏ nhận định đó bằng dữ liệu."},
    {"tu":"insight","loai":"noun","ipa":"/ˈɪnˌsaɪt/","nghia":"sự hiểu biết sâu sắc","viDu":"The book gives insight into Vietnamese culture.","dich":"Cuốn sách mang lại hiểu biết sâu sắc về văn hóa Việt Nam."},
    {"tu":"convey","loai":"verb","ipa":"/kənˈveɪ/","nghia":"truyền đạt","viDu":"Words cannot convey how grateful I am.","dich":"Lời nói không thể truyền đạt hết lòng biết ơn của tôi."},
    {"tu":"assertive","loai":"adjective","ipa":"/əˈsɜrtɪv/","nghia":"quyết đoán","viDu":"You need to be more assertive in meetings.","dich":"Bạn cần quyết đoán hơn trong các cuộc họp."},
    {"tu":"rapport","loai":"noun","ipa":"/ræˈpɔr/","nghia":"mối quan hệ hòa hợp","viDu":"She quickly built rapport with her clients.","dich":"Cô ấy nhanh chóng tạo được sự hòa hợp với khách hàng."},
    {"tu":"paraphrase","loai":"verb","ipa":"/ˈpɛrəˌfreɪz/","nghia":"diễn đạt lại","viDu":"Can you paraphrase the question?","dich":"Bạn có thể diễn đạt lại câu hỏi không?"}
  ]},
  {"ten":"TOEIC mới bắt đầu — Văn phòng và đi lại","cu":"Khởi động — TOEIC mới bắt đầu","mucTieu":"TOEIC","trinhDo":"MOI_BAT_DAU",
   "moTa":"Từ vựng TOEIC nền tảng về văn phòng, đồng nghiệp, khách hàng, sân bay và khách sạn.","the":[
    {"tu":"office","loai":"noun","ipa":"/ˈɔfɪs/","nghia":"văn phòng","viDu":"The office opens at eight.","dich":"Văn phòng mở cửa lúc tám giờ."},
    {"tu":"meeting","loai":"noun","ipa":"/ˈmitɪŋ/","nghia":"cuộc họp","viDu":"The meeting starts soon.","dich":"Cuộc họp sắp bắt đầu."},
    {"tu":"ticket","loai":"noun","ipa":"/ˈtɪkɪt/","nghia":"vé","viDu":"Please show your ticket.","dich":"Vui lòng xuất trình vé của bạn."},
    {"tu":"desk","loai":"noun","ipa":"/dɛsk/","nghia":"bàn làm việc","viDu":"Please leave the file on my desk.","dich":"Vui lòng để tập hồ sơ trên bàn của tôi."},
    {"tu":"manager","loai":"noun","ipa":"/ˈmænɪdʒər/","nghia":"người quản lý","viDu":"The manager is in a meeting.","dich":"Quản lý đang họp."},
    {"tu":"colleague","loai":"noun","ipa":"/ˈkɑliɡ/","nghia":"đồng nghiệp","viDu":"My colleague helped me with the report.","dich":"Đồng nghiệp đã giúp tôi làm báo cáo."},
    {"tu":"schedule","loai":"noun","ipa":"/ˈskɛdʒul/","nghia":"lịch trình","viDu":"Check the schedule before you leave.","dich":"Kiểm tra lịch trình trước khi bạn đi."},
    {"tu":"deadline","loai":"noun","ipa":"/ˈdɛdˌlaɪn/","nghia":"hạn chót","viDu":"The deadline is next Monday.","dich":"Hạn chót là thứ Hai tuần sau."},
    {"tu":"printer","loai":"noun","ipa":"/ˈprɪntər/","nghia":"máy in","viDu":"The printer is out of paper.","dich":"Máy in hết giấy."},
    {"tu":"email","loai":"noun","ipa":"/ˈiˌmeɪl/","nghia":"thư điện tử","viDu":"I will send you an email today.","dich":"Hôm nay tôi sẽ gửi email cho bạn."},
    {"tu":"customer","loai":"noun","ipa":"/ˈkʌstəmər/","nghia":"khách hàng","viDu":"The customer asked for a refund.","dich":"Khách hàng yêu cầu hoàn tiền."},
    {"tu":"visitor","loai":"noun","ipa":"/ˈvɪzɪtər/","nghia":"khách đến thăm","viDu":"Every visitor must sign in at the front desk.","dich":"Mọi khách đến thăm phải đăng ký ở quầy lễ tân."},
    {"tu":"lobby","loai":"noun","ipa":"/ˈlɑbi/","nghia":"sảnh","viDu":"Wait for me in the lobby.","dich":"Hãy đợi tôi ở sảnh."},
    {"tu":"elevator","loai":"noun","ipa":"/ˈɛləˌveɪtər/","nghia":"thang máy","viDu":"Take the elevator to the fifth floor.","dich":"Đi thang máy lên tầng năm."},
    {"tu":"flight","loai":"noun","ipa":"/flaɪt/","nghia":"chuyến bay","viDu":"Our flight was delayed by an hour.","dich":"Chuyến bay của chúng tôi bị trễ một tiếng."},
    {"tu":"airport","loai":"noun","ipa":"/ˈɛrˌpɔrt/","nghia":"sân bay","viDu":"I will meet you at the airport.","dich":"Tôi sẽ đón bạn ở sân bay."},
    {"tu":"passenger","loai":"noun","ipa":"/ˈpæsəndʒər/","nghia":"hành khách","viDu":"Each passenger must show a passport.","dich":"Mỗi hành khách phải xuất trình hộ chiếu."},
    {"tu":"hotel","loai":"noun","ipa":"/hoʊˈtɛl/","nghia":"khách sạn","viDu":"The hotel is close to the station.","dich":"Khách sạn gần nhà ga."},
    {"tu":"price","loai":"noun","ipa":"/praɪs/","nghia":"giá","viDu":"The price includes breakfast.","dich":"Giá đã bao gồm bữa sáng."},
    {"tu":"staff","loai":"noun","ipa":"/stæf/","nghia":"đội ngũ nhân viên","viDu":"The staff are very friendly.","dich":"Nhân viên rất thân thiện."},
    {"tu":"break","loai":"noun","ipa":"/breɪk/","nghia":"giờ nghỉ giải lao","viDu":"Shall we take a short break?","dich":"Chúng ta nghỉ giải lao một chút nhé?"},
    {"tu":"report","loai":"noun","ipa":"/rɪˈpɔrt/","nghia":"báo cáo","viDu":"The report is due on Friday.","dich":"Báo cáo phải nộp vào thứ Sáu."},
    {"tu":"copy","loai":"noun","ipa":"/ˈkɑpi/","nghia":"bản sao","viDu":"Please make a copy of this page.","dich":"Vui lòng sao một bản trang này."},
    {"tu":"parking lot","loai":"noun","ipa":"/ˈpɑrkɪŋ ˌlɑt/","nghia":"bãi đỗ xe","viDu":"The parking lot is behind the building.","dich":"Bãi đỗ xe ở phía sau tòa nhà."},
    {"tu":"receptionist","loai":"noun","ipa":"/rɪˈsɛpʃənɪst/","nghia":"nhân viên lễ tân","viDu":"Ask the receptionist for a map.","dich":"Hãy hỏi lễ tân xin bản đồ."},
    {"tu":"open","loai":"adjective","ipa":"/ˈoʊpən/","nghia":"đang mở cửa","viDu":"The store is open until nine.","dich":"Cửa hàng mở cửa đến chín giờ."},
    {"tu":"closed","loai":"adjective","ipa":"/kloʊzd/","nghia":"đóng cửa","viDu":"The bank is closed on Sunday.","dich":"Ngân hàng đóng cửa vào Chủ nhật."},
    {"tu":"package","loai":"noun","ipa":"/ˈpækɪdʒ/","nghia":"bưu kiện","viDu":"A package arrived for you this morning.","dich":"Sáng nay có một bưu kiện gửi cho bạn."},
    {"tu":"uniform","loai":"noun","ipa":"/ˈjunəˌfɔrm/","nghia":"đồng phục","viDu":"All workers wear a uniform.","dich":"Tất cả công nhân mặc đồng phục."},
    {"tu":"train","loai":"noun","ipa":"/treɪn/","nghia":"tàu hỏa","viDu":"The train to Hanoi leaves at six.","dich":"Chuyến tàu đi Hà Nội khởi hành lúc sáu giờ."}
  ]},
  {"ten":"TOEIC cơ bản — Mua bán, giao hàng và đặt chỗ","cu":"Khởi động — TOEIC cơ bản","mucTieu":"TOEIC","trinhDo":"CO_BAN",
   "moTa":"Từ vựng TOEIC về đơn hàng, thanh toán, giao nhận, bảo hành và đặt chỗ du lịch.","the":[
    {"tu":"invoice","loai":"noun","ipa":"/ˈɪnvɔɪs/","nghia":"hóa đơn","viDu":"Please send the invoice by email.","dich":"Vui lòng gửi hóa đơn qua email."},
    {"tu":"shipment","loai":"noun","ipa":"/ˈʃɪpmənt/","nghia":"lô hàng được vận chuyển","viDu":"The shipment arrived today.","dich":"Lô hàng đã đến hôm nay."},
    {"tu":"reservation","loai":"noun","ipa":"/ˌrɛzərˈveɪʃən/","nghia":"việc đặt chỗ","viDu":"I would like to confirm my reservation.","dich":"Tôi muốn xác nhận việc đặt chỗ của mình."},
    {"tu":"purchase","loai":"noun","ipa":"/ˈpɜrtʃəs/","nghia":"việc mua hàng","viDu":"Keep the receipt as proof of purchase.","dich":"Giữ biên lai làm bằng chứng mua hàng."},
    {"tu":"refund","loai":"noun","ipa":"/ˈriˌfʌnd/","nghia":"khoản hoàn tiền","viDu":"You can ask for a full refund.","dich":"Bạn có thể yêu cầu hoàn tiền toàn bộ."},
    {"tu":"delivery","loai":"noun","ipa":"/dɪˈlɪvəri/","nghia":"việc giao hàng","viDu":"Delivery is free for large orders.","dich":"Miễn phí giao hàng cho đơn hàng lớn."},
    {"tu":"warehouse","loai":"noun","ipa":"/ˈwɛrˌhaʊs/","nghia":"nhà kho","viDu":"The goods are stored in the warehouse.","dich":"Hàng hóa được lưu trong nhà kho."},
    {"tu":"supplier","loai":"noun","ipa":"/səˈplaɪər/","nghia":"nhà cung cấp","viDu":"We changed our paper supplier.","dich":"Chúng tôi đã đổi nhà cung cấp giấy."},
    {"tu":"catalog","loai":"noun","ipa":"/ˈkætəˌlɔɡ/","nghia":"danh mục sản phẩm","viDu":"Please check our new catalog.","dich":"Vui lòng xem danh mục sản phẩm mới của chúng tôi."},
    {"tu":"payment","loai":"noun","ipa":"/ˈpeɪmənt/","nghia":"khoản thanh toán","viDu":"Payment is due within thirty days.","dich":"Khoản thanh toán đến hạn trong vòng ba mươi ngày."},
    {"tu":"quote","loai":"noun","ipa":"/kwoʊt/","nghia":"bảng báo giá","viDu":"Can you send me a quote for the repairs?","dich":"Bạn có thể gửi tôi báo giá sửa chữa không?"},
    {"tu":"stock","loai":"noun","ipa":"/stɑk/","nghia":"hàng trong kho","viDu":"This item is out of stock.","dich":"Mặt hàng này đã hết hàng."},
    {"tu":"confirm","loai":"verb","ipa":"/kənˈfɜrm/","nghia":"xác nhận","viDu":"Please confirm your order by email.","dich":"Vui lòng xác nhận đơn hàng qua email."},
    {"tu":"brochure","loai":"noun","ipa":"/broʊˈʃʊr/","nghia":"tờ giới thiệu; tờ quảng cáo","viDu":"Take a brochure about our tours.","dich":"Hãy lấy một tờ giới thiệu về các tour của chúng tôi."},
    {"tu":"check in","loai":"phrasal verb","ipa":"/ˌtʃɛk ˈɪn/","nghia":"làm thủ tục nhận phòng","viDu":"Guests can check in after 2 p.m.","dich":"Khách có thể nhận phòng sau 2 giờ chiều."},
    {"tu":"itinerary","loai":"noun","ipa":"/aɪˈtɪnəˌrɛri/","nghia":"lịch trình chuyến đi","viDu":"The travel agent sent us the itinerary.","dich":"Đại lý du lịch đã gửi lịch trình cho chúng tôi."},
    {"tu":"departure","loai":"noun","ipa":"/dɪˈpɑrtʃər/","nghia":"sự khởi hành","viDu":"The departure time has changed.","dich":"Giờ khởi hành đã thay đổi."},
    {"tu":"arrival","loai":"noun","ipa":"/əˈraɪvəl/","nghia":"sự đến nơi","viDu":"Please call us on arrival.","dich":"Vui lòng gọi cho chúng tôi khi đến nơi."},
    {"tu":"vacancy","loai":"noun","ipa":"/ˈveɪkənsi/","nghia":"phòng trống; vị trí trống","viDu":"The hotel has no vacancy tonight.","dich":"Tối nay khách sạn không còn phòng trống."},
    {"tu":"coupon","loai":"noun","ipa":"/ˈkuˌpɑn/","nghia":"phiếu giảm giá","viDu":"Use this coupon to save ten percent.","dich":"Dùng phiếu này để tiết kiệm mười phần trăm."},
    {"tu":"warranty","loai":"noun","ipa":"/ˈwɔrənti/","nghia":"sự bảo hành","viDu":"The laptop comes with a two-year warranty.","dich":"Máy tính xách tay được bảo hành hai năm."},
    {"tu":"customer service","loai":"noun","ipa":"/ˈkʌstəmər ˈsɜrvɪs/","nghia":"dịch vụ khách hàng","viDu":"Call customer service if you have a problem.","dich":"Hãy gọi dịch vụ khách hàng nếu bạn gặp vấn đề."},
    {"tu":"defective","loai":"adjective","ipa":"/dɪˈfɛktɪv/","nghia":"bị lỗi","viDu":"We will replace any defective item.","dich":"Chúng tôi sẽ đổi mọi sản phẩm bị lỗi."},
    {"tu":"exchange","loai":"verb","ipa":"/ɪksˈtʃeɪndʒ/","nghia":"đổi (hàng)","viDu":"Can I exchange this shirt for a bigger one?","dich":"Tôi có thể đổi áo này lấy cái lớn hơn không?"},
    {"tu":"tracking number","loai":"noun","ipa":"/ˈtrækɪŋ ˌnʌmbər/","nghia":"mã vận đơn","viDu":"Use the tracking number to check your package.","dich":"Dùng mã vận đơn để kiểm tra bưu kiện của bạn."},
    {"tu":"ship","loai":"verb","ipa":"/ʃɪp/","nghia":"gửi hàng","viDu":"We ship orders within two days.","dich":"Chúng tôi gửi hàng trong vòng hai ngày."},
    {"tu":"fee","loai":"noun","ipa":"/fi/","nghia":"phí","viDu":"There is a small fee for late payment.","dich":"Có một khoản phí nhỏ cho việc trả chậm."},
    {"tu":"branch","loai":"noun","ipa":"/bræntʃ/","nghia":"chi nhánh","viDu":"The bank opened a new branch downtown.","dich":"Ngân hàng mở chi nhánh mới ở trung tâm."},
    {"tu":"sold out","loai":"adjective","ipa":"/ˌsoʊld ˈaʊt/","nghia":"đã bán hết","viDu":"The concert tickets are sold out.","dich":"Vé buổi hòa nhạc đã bán hết."},
    {"tu":"in advance","loai":"phrase","ipa":"/ˌɪn ədˈvæns/","nghia":"trước (thời hạn)","viDu":"Please book your table in advance.","dich":"Vui lòng đặt bàn trước."}
  ]},
  {"ten":"TOEIC trung cấp — Tài chính, nhân sự và quy trình","cu":"Khởi động — TOEIC trung cấp","mucTieu":"TOEIC","trinhDo":"TRUNG_CAP",
   "moTa":"Từ vựng TOEIC về ngân sách, kiểm toán, mua sắm, tuyển dụng, họp và bảo trì.","the":[
    {"tu":"reimbursement","loai":"noun","ipa":"/ˌriɪmˈbɜrsmənt/","nghia":"việc hoàn trả chi phí","viDu":"Submit your receipts for reimbursement.","dich":"Nộp các biên lai để được hoàn trả chi phí."},
    {"tu":"procurement","loai":"noun","ipa":"/proʊˈkjʊrmənt/","nghia":"việc mua sắm hàng hóa cho tổ chức","viDu":"The procurement team reviewed the offers.","dich":"Nhóm mua sắm đã xem xét các chào hàng."},
    {"tu":"compliance","loai":"noun","ipa":"/kəmˈplaɪəns/","nghia":"sự tuân thủ","viDu":"The audit checks compliance with safety rules.","dich":"Cuộc kiểm tra đánh giá việc tuân thủ quy định an toàn."},
    {"tu":"budget","loai":"noun","ipa":"/ˈbʌdʒɪt/","nghia":"ngân sách","viDu":"The project is over budget.","dich":"Dự án đã vượt ngân sách."},
    {"tu":"expense","loai":"noun","ipa":"/ɪkˈspɛns/","nghia":"chi phí","viDu":"Travel expenses will be paid by the company.","dich":"Chi phí đi lại sẽ do công ty chi trả."},
    {"tu":"revenue","loai":"noun","ipa":"/ˈrɛvəˌnu/","nghia":"doanh thu","viDu":"Revenue grew by ten percent this year.","dich":"Doanh thu tăng mười phần trăm trong năm nay."},
    {"tu":"profit","loai":"noun","ipa":"/ˈprɑfɪt/","nghia":"lợi nhuận","viDu":"The company made a small profit.","dich":"Công ty thu được một khoản lợi nhuận nhỏ."},
    {"tu":"quarterly","loai":"adjective","ipa":"/ˈkwɔrtərli/","nghia":"hằng quý","viDu":"The quarterly report is ready.","dich":"Báo cáo hằng quý đã sẵn sàng."},
    {"tu":"audit","loai":"noun","ipa":"/ˈɔdɪt/","nghia":"cuộc kiểm toán","viDu":"The audit will take two weeks.","dich":"Cuộc kiểm toán sẽ kéo dài hai tuần."},
    {"tu":"approve","loai":"verb","ipa":"/əˈpruv/","nghia":"phê duyệt","viDu":"The director must approve the budget.","dich":"Giám đốc phải phê duyệt ngân sách."},
    {"tu":"submit","loai":"verb","ipa":"/səbˈmɪt/","nghia":"nộp","viDu":"Submit the form before Friday.","dich":"Nộp mẫu đơn trước thứ Sáu."},
    {"tu":"policy","loai":"noun","ipa":"/ˈpɑləsi/","nghia":"chính sách","viDu":"Read the company policy on overtime.","dich":"Hãy đọc chính sách của công ty về làm thêm giờ."},
    {"tu":"regulation","loai":"noun","ipa":"/ˌrɛɡjəˈleɪʃən/","nghia":"quy định","viDu":"New safety regulations start next month.","dich":"Các quy định an toàn mới có hiệu lực từ tháng sau."},
    {"tu":"inventory","loai":"noun","ipa":"/ˈɪnvənˌtɔri/","nghia":"hàng tồn kho; việc kiểm kê","viDu":"We count the inventory every month.","dich":"Chúng tôi kiểm kê hàng tồn kho mỗi tháng."},
    {"tu":"vendor","loai":"noun","ipa":"/ˈvɛndər/","nghia":"nhà cung cấp; người bán","viDu":"We compared prices from three vendors.","dich":"Chúng tôi so sánh giá của ba nhà cung cấp."},
    {"tu":"bid","loai":"noun","ipa":"/bɪd/","nghia":"giá thầu; hồ sơ dự thầu","viDu":"Our company won the bid.","dich":"Công ty chúng tôi đã thắng thầu."},
    {"tu":"estimate","loai":"noun","ipa":"/ˈɛstəmət/","nghia":"bản ước tính","viDu":"The estimate for the repair is too high.","dich":"Bản ước tính chi phí sửa chữa quá cao."},
    {"tu":"payroll","loai":"noun","ipa":"/ˈpeɪˌroʊl/","nghia":"bảng lương","viDu":"The payroll department handles salaries.","dich":"Phòng lương xử lý tiền lương."},
    {"tu":"applicant","loai":"noun","ipa":"/ˈæplɪkənt/","nghia":"ứng viên","viDu":"Each applicant must send a resume.","dich":"Mỗi ứng viên phải gửi sơ yếu lý lịch."},
    {"tu":"recruit","loai":"verb","ipa":"/rɪˈkrut/","nghia":"tuyển dụng","viDu":"We plan to recruit five engineers.","dich":"Chúng tôi dự định tuyển năm kỹ sư."},
    {"tu":"performance review","loai":"noun","ipa":"/pərˈfɔrməns rɪˌvju/","nghia":"buổi đánh giá hiệu suất","viDu":"My performance review is next week.","dich":"Buổi đánh giá hiệu suất của tôi vào tuần sau."},
    {"tu":"promotion","loai":"noun","ipa":"/prəˈmoʊʃən/","nghia":"sự thăng chức","viDu":"She got a promotion last year.","dich":"Cô ấy được thăng chức năm ngoái."},
    {"tu":"workshop","loai":"noun","ipa":"/ˈwɜrkˌʃɑp/","nghia":"buổi hội thảo thực hành","viDu":"Staff will attend a training workshop.","dich":"Nhân viên sẽ tham gia một buổi hội thảo đào tạo."},
    {"tu":"agenda","loai":"noun","ipa":"/əˈdʒɛndə/","nghia":"chương trình họp","viDu":"The agenda was sent to everyone.","dich":"Chương trình họp đã được gửi cho mọi người."},
    {"tu":"minutes","loai":"noun","ipa":"/ˈmɪnɪts/","nghia":"biên bản cuộc họp","viDu":"Who will take the minutes today?","dich":"Hôm nay ai sẽ ghi biên bản họp?"},
    {"tu":"headquarters","loai":"noun","ipa":"/ˈhɛdˌkwɔrtərz/","nghia":"trụ sở chính","viDu":"Our headquarters are in Ho Chi Minh City.","dich":"Trụ sở chính của chúng tôi ở Thành phố Hồ Chí Minh."},
    {"tu":"merchandise","loai":"noun","ipa":"/ˈmɜrtʃənˌdaɪz/","nghia":"hàng hóa","viDu":"New merchandise arrives every Monday.","dich":"Hàng hóa mới về mỗi thứ Hai."},
    {"tu":"maintenance","loai":"noun","ipa":"/ˈmeɪntənəns/","nghia":"việc bảo trì","viDu":"The elevator is closed for maintenance.","dich":"Thang máy tạm ngừng để bảo trì."},
    {"tu":"shift","loai":"noun","ipa":"/ʃɪft/","nghia":"ca làm việc","viDu":"I work the night shift this week.","dich":"Tuần này tôi làm ca đêm."},
    {"tu":"deposit","loai":"noun","ipa":"/dɪˈpɑzɪt/","nghia":"tiền đặt cọc","viDu":"A deposit is required to book the room.","dich":"Cần đặt cọc để giữ phòng."}
  ]},
  {"ten":"TOEIC nâng cao — Hợp đồng, rủi ro và chiến lược","cu":"Khởi động — TOEIC nâng cao","mucTieu":"TOEIC","trinhDo":"NANG_CAO",
   "moTa":"Từ vựng TOEIC nâng cao về hợp đồng, pháp lý, rủi ro, sáp nhập và kế hoạch tài chính.","the":[
    {"tu":"contingency","loai":"noun","ipa":"/kənˈtɪndʒənsi/","nghia":"tình huống có thể xảy ra ngoài dự kiến","viDu":"We prepared a contingency plan.","dich":"Chúng tôi đã chuẩn bị một kế hoạch dự phòng."},
    {"tu":"liability","loai":"noun","ipa":"/ˌlaɪəˈbɪləti/","nghia":"trách nhiệm pháp lý","viDu":"The contract limits the liability of each party.","dich":"Hợp đồng giới hạn trách nhiệm pháp lý của mỗi bên."},
    {"tu":"expedite","loai":"verb","ipa":"/ˈɛkspəˌdaɪt/","nghia":"đẩy nhanh tiến độ","viDu":"Please expedite the delivery.","dich":"Vui lòng đẩy nhanh việc giao hàng."},
    {"tu":"stipulate","loai":"verb","ipa":"/ˈstɪpjəˌleɪt/","nghia":"quy định rõ (trong văn bản)","viDu":"The contract stipulates a delivery date.","dich":"Hợp đồng quy định rõ ngày giao hàng."},
    {"tu":"clause","loai":"noun","ipa":"/klɔz/","nghia":"điều khoản","viDu":"Read the cancellation clause carefully.","dich":"Hãy đọc kỹ điều khoản hủy."},
    {"tu":"amendment","loai":"noun","ipa":"/əˈmɛndmənt/","nghia":"bản sửa đổi","viDu":"Both sides signed the amendment.","dich":"Hai bên đã ký bản sửa đổi."},
    {"tu":"terminate","loai":"verb","ipa":"/ˈtɜrməˌneɪt/","nghia":"chấm dứt","viDu":"Either party may terminate the agreement.","dich":"Bên nào cũng có thể chấm dứt thỏa thuận."},
    {"tu":"breach","loai":"noun","ipa":"/britʃ/","nghia":"sự vi phạm","viDu":"Late payment is a breach of contract.","dich":"Thanh toán trễ là vi phạm hợp đồng."},
    {"tu":"mitigate","loai":"verb","ipa":"/ˈmɪtɪˌɡeɪt/","nghia":"giảm thiểu","viDu":"We must mitigate the risks of the project.","dich":"Chúng ta phải giảm thiểu rủi ro của dự án."},
    {"tu":"leverage","loai":"verb","ipa":"/ˈlɛvərɪdʒ/","nghia":"tận dụng","viDu":"We can leverage our customer data.","dich":"Chúng ta có thể tận dụng dữ liệu khách hàng."},
    {"tu":"acquisition","loai":"noun","ipa":"/ˌækwəˈzɪʃən/","nghia":"việc mua lại (công ty)","viDu":"The acquisition was completed in March.","dich":"Thương vụ mua lại hoàn tất vào tháng Ba."},
    {"tu":"merger","loai":"noun","ipa":"/ˈmɜrdʒər/","nghia":"sự sáp nhập","viDu":"The merger created a larger bank.","dich":"Việc sáp nhập đã tạo ra một ngân hàng lớn hơn."},
    {"tu":"stakeholder","loai":"noun","ipa":"/ˈsteɪkˌhoʊldər/","nghia":"bên liên quan","viDu":"We met every stakeholder before the launch.","dich":"Chúng tôi đã gặp từng bên liên quan trước khi ra mắt."},
    {"tu":"feasibility","loai":"noun","ipa":"/ˌfizəˈbɪləti/","nghia":"tính khả thi","viDu":"The team is studying the feasibility of the plan.","dich":"Nhóm đang nghiên cứu tính khả thi của kế hoạch."},
    {"tu":"benchmark","loai":"noun","ipa":"/ˈbɛntʃˌmɑrk/","nghia":"chuẩn so sánh","viDu":"This product is the benchmark for quality.","dich":"Sản phẩm này là chuẩn mực về chất lượng."},
    {"tu":"forecast","loai":"noun","ipa":"/ˈfɔrˌkæst/","nghia":"dự báo","viDu":"The sales forecast looks positive.","dich":"Dự báo doanh số có vẻ khả quan."},
    {"tu":"incentive","loai":"noun","ipa":"/ɪnˈsɛntɪv/","nghia":"khoản khuyến khích","viDu":"Employees receive an incentive for good results.","dich":"Nhân viên nhận khoản khuyến khích khi đạt kết quả tốt."},
    {"tu":"consolidate","loai":"verb","ipa":"/kənˈsɑləˌdeɪt/","nghia":"hợp nhất; củng cố","viDu":"We plan to consolidate our two offices.","dich":"Chúng tôi dự định hợp nhất hai văn phòng."},
    {"tu":"allocate","loai":"verb","ipa":"/ˈæləˌkeɪt/","nghia":"phân bổ","viDu":"We need to allocate more money to marketing.","dich":"Chúng ta cần phân bổ thêm tiền cho tiếp thị."},
    {"tu":"outsource","loai":"verb","ipa":"/ˈaʊtˌsɔrs/","nghia":"thuê ngoài","viDu":"Many firms outsource their IT support.","dich":"Nhiều công ty thuê ngoài bộ phận hỗ trợ công nghệ thông tin."},
    {"tu":"jurisdiction","loai":"noun","ipa":"/ˌdʒʊrɪsˈdɪkʃən/","nghia":"thẩm quyền xét xử","viDu":"The case is outside our jurisdiction.","dich":"Vụ việc nằm ngoài thẩm quyền của chúng tôi."},
    {"tu":"arbitration","loai":"noun","ipa":"/ˌɑrbɪˈtreɪʃən/","nghia":"việc giải quyết tranh chấp bằng trọng tài","viDu":"The dispute will go to arbitration.","dich":"Tranh chấp sẽ được đưa ra trọng tài."},
    {"tu":"confidential","loai":"adjective","ipa":"/ˌkɑnfɪˈdɛnʃəl/","nghia":"bảo mật","viDu":"This information is strictly confidential.","dich":"Thông tin này được bảo mật tuyệt đối."},
    {"tu":"comprehensive","loai":"adjective","ipa":"/ˌkɑmprɪˈhɛnsɪv/","nghia":"toàn diện","viDu":"We offer comprehensive insurance.","dich":"Chúng tôi cung cấp bảo hiểm toàn diện."},
    {"tu":"prerequisite","loai":"noun","ipa":"/priˈrɛkwəzɪt/","nghia":"điều kiện tiên quyết","viDu":"Experience is a prerequisite for this job.","dich":"Kinh nghiệm là điều kiện tiên quyết cho công việc này."},
    {"tu":"discrepancy","loai":"noun","ipa":"/dɪˈskrɛpənsi/","nghia":"sự chênh lệch","viDu":"There is a discrepancy between the two reports.","dich":"Có sự chênh lệch giữa hai báo cáo."},
    {"tu":"surplus","loai":"noun","ipa":"/ˈsɜrpləs/","nghia":"thặng dư","viDu":"The company had a budget surplus this year.","dich":"Năm nay công ty có thặng dư ngân sách."},
    {"tu":"deficit","loai":"noun","ipa":"/ˈdɛfəsɪt/","nghia":"thâm hụt","viDu":"The trade deficit grew last quarter.","dich":"Thâm hụt thương mại tăng trong quý trước."},
    {"tu":"streamline","loai":"verb","ipa":"/ˈstrimˌlaɪn/","nghia":"tinh gọn","viDu":"New software will streamline the process.","dich":"Phần mềm mới sẽ tinh gọn quy trình."},
    {"tu":"collateral","loai":"noun","ipa":"/kəˈlætərəl/","nghia":"tài sản thế chấp","viDu":"The bank asked for collateral for the loan.","dich":"Ngân hàng yêu cầu tài sản thế chấp cho khoản vay."}
  ]}
]';

UPDATE bo_the deck
JOIN JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    cu VARCHAR(150) PATH '$.cu'
)) catalog ON deck.ten = catalog.cu
SET deck.ten = catalog.ten, deck.updated_at = @library_now
WHERE deck.chu_so_huu_id = @library_author;

UPDATE bo_the deck
JOIN JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    mo_ta VARCHAR(500) PATH '$.moTa'
)) catalog ON deck.ten = catalog.ten
SET deck.mo_ta = catalog.mo_ta, deck.updated_at = @library_now
WHERE deck.chu_so_huu_id = @library_author AND NOT (deck.mo_ta <=> catalog.mo_ta);

INSERT INTO bo_the (chu_so_huu_id, ten, mo_ta, trinh_do, muc_tieu, quyen_truy_cap, trang_thai_kiem_duyet, bo_mau)
SELECT @library_author, catalog.ten, catalog.mo_ta, catalog.trinh_do, catalog.muc_tieu, 'CONG_KHAI', 'BINH_THUONG', TRUE
FROM JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    mo_ta VARCHAR(500) PATH '$.moTa',
    trinh_do VARCHAR(20) PATH '$.trinhDo',
    muc_tieu VARCHAR(20) PATH '$.mucTieu'
)) catalog
WHERE NOT EXISTS (
    SELECT 1 FROM bo_the existing
    WHERE existing.chu_so_huu_id = @library_author AND existing.ten = catalog.ten
);

UPDATE the_tu_vung card
JOIN bo_the deck ON deck.id = card.bo_the_id AND deck.chu_so_huu_id = @library_author
JOIN JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
    ten VARCHAR(150) PATH '$.ten',
    NESTED PATH '$.the[*]' COLUMNS (
        tu VARCHAR(100) PATH '$.tu',
        tu_loai VARCHAR(30) PATH '$.loai',
        phien_am VARCHAR(100) PATH '$.ipa',
        nghia VARCHAR(500) PATH '$.nghia',
        vi_du VARCHAR(300) PATH '$.viDu',
        dich VARCHAR(300) PATH '$.dich'
    )
)) catalog ON catalog.ten = deck.ten AND catalog.tu = card.tu
SET card.tu_loai = catalog.tu_loai, card.phien_am = catalog.phien_am, card.nghia_vi = catalog.nghia,
    card.vi_du_en = catalog.vi_du, card.dich_vi = catalog.dich, card.nguon = @library_source,
    card.version = card.version + 1, card.updated_at = @library_now
WHERE card.xoa_at IS NULL AND NOT (
    card.tu_loai <=> catalog.tu_loai AND card.phien_am <=> catalog.phien_am AND card.nghia_vi <=> catalog.nghia
    AND card.vi_du_en <=> catalog.vi_du AND card.dich_vi <=> catalog.dich AND card.nguon <=> @library_source
);

INSERT INTO the_tu_vung (bo_the_id, tu, tu_loai, nghia_vi, phien_am, vi_du_en, dich_vi, do_kho, nguon)
SELECT deck.id, catalog.tu, catalog.tu_loai, catalog.nghia, catalog.phien_am, catalog.vi_du, catalog.dich,
       CASE deck.trinh_do WHEN 'MOI_BAT_DAU' THEN 1 WHEN 'CO_BAN' THEN 2 WHEN 'TRUNG_CAP' THEN 3 ELSE 4 END,
       @library_source
FROM JSON_TABLE(@library_catalog, '$[*]' COLUMNS (
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
JOIN bo_the deck ON deck.chu_so_huu_id = @library_author AND deck.ten = catalog.ten
WHERE NOT EXISTS (
    SELECT 1 FROM the_tu_vung existing
    WHERE existing.bo_the_id = deck.id AND existing.tu = catalog.tu
);
