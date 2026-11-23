/* Dữ liệu hỗ trợ chỉ lưu trong trình duyệt; dùng chung cho hai màn mockup. */
(() => {
  'use strict';
  const PREFIX = 'vocab:support-tickets:v1:';
  const fixtures = [
    ['Không nghe được âm thanh khi luyện phát âm', 'Mình đã bật âm lượng nhưng không nghe được âm thanh mẫu trong bài luyện phát âm trên Chrome.', 'technical', 'high', 'open'],
    ['Gói Pro chưa được kích hoạt sau thanh toán', 'Mình đã thanh toán thành công qua VNPay nhưng tài khoản vẫn chưa hiển thị gói Pro.', 'payment', 'critical', 'open'],
    ['Cần hướng dẫn điều chỉnh mục tiêu học tập', 'Mình muốn chuyển mục tiêu từ giao tiếp sang TOEIC. Nhờ đội ngũ hướng dẫn cách cập nhật.', 'academic', 'medium', 'open'],
    ['Không tải được ảnh minh họa cho bộ thẻ', 'Ảnh minh họa trong bộ thẻ TOEIC công sở không hiển thị khi mình mở trên điện thoại.', 'technical', 'medium', 'open'],
    ['Đề xuất thêm chủ đề từ vựng du lịch', 'Mình mong có thêm bộ từ vựng về đặt phòng khách sạn và hỏi đường để luyện giao tiếp.', 'other', 'low', 'resolved'],
    ['Cần kiểm tra lịch sử giao dịch tháng này', 'Mình muốn xem lại biên nhận và thời hạn của gói Premium vừa gia hạn.', 'payment', 'medium', 'resolved'],
    ['Tiến độ học chưa cập nhật trên thiết bị mới', 'Sau khi đăng nhập trên máy tính, số thẻ đã học khác với tiến độ trên điện thoại.', 'technical', 'high', 'open'],
    ['Thắc mắc về lịch ôn tập của bộ thẻ', 'Một số từ đã nhớ vẫn xuất hiện trong lịch ôn. Mình cần giải thích thêm cách tính lịch ôn.', 'academic', 'low', 'resolved'],
    ['Không thể nhập bộ thẻ từ tệp CSV', 'Mình chọn tệp CSV đúng định dạng nhưng màn hình không hiển thị phần xem trước.', 'technical', 'medium', 'resolved'],
    ['Nhờ hỗ trợ thay đổi thông tin cá nhân', 'Mình cần cập nhật tên hiển thị và múi giờ để nhận thông báo học đúng giờ.', 'other', 'low', 'resolved'],
    ['Thông báo nhắc học không xuất hiện', 'Mình đã bật nhắc học hằng ngày trong cài đặt nhưng chưa nhận được thông báo.', 'technical', 'medium', 'open'],
    ['Câu hỏi về nội dung bộ TOEIC nâng cao', 'Mình muốn biết trình độ phù hợp trước khi bắt đầu bộ từ vựng TOEIC nâng cao.', 'academic', 'medium', 'resolved']
  ];
  const seed = () => fixtures.map(([title, description, category, priority, status], index) => ({
    id: 'HT-' + String(1042 - index), title, description, category, priority, status,
    createdAt: new Date(Date.UTC(2026, 10, 22 - index, 2, 30)).toISOString()
  }));
  function read(userId) {
    const storageKey = PREFIX + userId;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.every(t => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.description === 'string' && ['technical', 'academic', 'payment', 'other'].includes(t.category) && ['low', 'medium', 'high', 'critical'].includes(t.priority) && ['open', 'resolved'].includes(t.status) && Number.isFinite(Date.parse(t.createdAt)))) return saved;
    } catch { /* Use the sample list when storage is unavailable or corrupt. */ }
    return seed();
  }
  window.SupportDemo = { PREFIX, read };
})();
