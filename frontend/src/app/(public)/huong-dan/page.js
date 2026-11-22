import Link from 'next/link';

const TOC = [
  ['bat-dau', 'Bắt đầu trong 3 bước'],
  ['moi-ngay', 'Một ngày học'],
  ['lat-the', 'Ôn một thẻ'],
  ['tu-danh-gia', 'Bốn mức tự đánh giá'],
  ['hoc-them', 'Hết bài hôm nay? Học thêm'],
  ['hai-chieu', 'Hai chiều học'],
  ['nghi-hoc', 'Khi nghỉ học vài ngày'],
  ['csv', 'Nhập từ tệp CSV'],
  ['phim-tat', 'Phím tắt'],
  ['hoi-dap', 'Câu hỏi thường gặp']
];

export default function Page() {
  return (
    <div className="doc-wrap">
      <article className="sheet doc" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Hướng dẫn</span><span>Đọc trong 5 phút</span></div>
          <h1 id="page-title">Cách học với VocabLearning</h1>
          <p>Mỗi ngày vài phút, làm theo thứ tự trang Hôm nay gợi ý, chấm thật lòng sau khi lật thẻ. Phần còn lại hệ thống lo.</p>
        </div>

        <h2 id="bat-dau">Bắt đầu trong 3 bước</h2>
        <ol>
          <li><Link href="/dang-ky">Tạo tài khoản</Link> và bấm liên kết trong thư xác thực.</li>
          <li>Chọn mục tiêu (Giao tiếp hoặc TOEIC), trình độ tự đánh giá và số phút mỗi ngày.</li>
          <li>Sao chép một bộ trong <Link href="/thu-vien">thư viện</Link>, tự tạo bộ, hoặc nhập từ tệp CSV.</li>
        </ol>

        <h2 id="moi-ngay">Một ngày học</h2>
        <p>Mở trang <strong>Hôm nay</strong>. Khối <em>Lộ trình hôm nay</em> xếp sẵn việc cần làm theo thứ tự ưu tiên, kèm số thẻ và thời gian ước tính:</p>
        <table>
          <thead><tr><th scope="col">Thứ tự</th><th scope="col">Việc</th><th scope="col">Vì sao</th></tr></thead>
          <tbody>
            <tr><td>1</td><td><strong>Ôn thẻ quá hạn</strong></td><td>Trễ càng lâu càng dễ quên hẳn.</td></tr>
            <tr><td>2</td><td><strong>Ôn thẻ đến hạn hôm nay</strong></td><td>Đúng lúc sắp quên, ôn bây giờ nhớ lâu nhất.</td></tr>
            <tr><td>3</td><td><strong>Học từ mới</strong></td><td>Làm sau cùng, có giới hạn mỗi ngày để bài ôn không dồn về sau.</td></tr>
          </tbody>
        </table>
        <p>Bấm <strong>Bắt đầu phiên hôm nay</strong> là phiên tự đi đúng thứ tự trên. Muốn học riêng một bộ, chọn ở ô <em>Học bộ nào?</em>. Phiên dở dang được lưu từng thẻ, quay lại bấm <em>Tiếp tục phiên</em>.</p>

        <h2 id="lat-the">Ôn một thẻ</h2>
        <ol>
          <li><strong>Nhìn mặt trước và tự nhớ trong đầu</strong> vài giây. Đây là bước giúp nhớ lâu, đừng lật ngay.</li>
          <li><strong>Lật thẻ</strong>: bấm vào thẻ hoặc nhấn <kbd>Space</kbd>. Bấm biểu tượng loa cạnh từ hoặc câu ví dụ để nghe đọc.</li>
          <li><strong>Chấm mức nhớ</strong> bằng một trong bốn nút. Hệ thống dựa vào đó để hẹn lần gặp lại.</li>
        </ol>

        <h2 id="tu-danh-gia">Bốn mức tự đánh giá</h2>
        <table>
          <thead><tr><th scope="col">Mức</th><th scope="col">Khi nào chọn</th><th scope="col">Điều xảy ra</th></tr></thead>
          <tbody>
            <tr><td><strong>Quên</strong> <kbd>1</kbd></td><td>Không nhớ ra, hoặc nhớ sai</td><td>Gặp lại ngay trong phiên, học lại từ đầu</td></tr>
            <tr><td><strong>Khó</strong> <kbd>2</kbd></td><td>Nhớ ra nhưng phải nghĩ lâu, hoặc đúng một phần</td><td>Khoảng cách tăng chậm</td></tr>
            <tr><td><strong>Nhớ</strong> <kbd>3</kbd></td><td>Nhớ đúng trong vài giây</td><td>Khoảng cách tăng bình thường</td></tr>
            <tr><td><strong>Dễ</strong> <kbd>4</kbd></td><td>Biết ngay, không cần nghĩ</td><td>Khoảng cách tăng nhiều hơn</td></tr>
          </tbody>
        </table>
        <p>Ví dụ một từ mới, lần nào cũng chọn Nhớ: gặp lại sau 10 phút, rồi 1 ngày, rồi vài ngày, rồi khoảng 2 tuần. Chấm thật lòng giúp lịch ôn vừa sức: chọn Dễ cho từ chưa chắc sẽ làm bạn quên trước lần ôn sau.</p>

        <h2 id="hoc-them">Hết bài hôm nay? Học thêm</h2>
        <p>Lịch ôn có thể hẹn vài ngày sau mới gặp lại một từ. Đó là chủ đích: ôn lại một từ đã nhớ quá sớm tốn thời gian mà ít tác dụng. Trong lúc chờ, trang Hôm nay luôn có mục <strong>Học thêm ngay</strong>:</p>
        <ul>
          <li><strong>Học chiều còn lại</strong> (Anh → Việt hoặc Việt → Anh). Mỗi chiều có lịch riêng nên thường vẫn còn thẻ.</li>
          <li><strong>Học một bộ khác</strong> còn thẻ cần ôn hoặc từ chưa học.</li>
          <li><strong>Luyện tập</strong>: chọn nghĩa, nghe viết, điền từ, phân biệt từ dễ nhầm. Không làm thay đổi lịch ôn.</li>
          <li><strong>Sổ tay từ khó</strong>: xem lại các từ bạn hay chọn Quên.</li>
          <li><strong>Tăng số từ mới mỗi ngày</strong> trong Thiết lập học, hoặc <strong>thêm bộ mới</strong> từ thư viện.</li>
        </ul>

        <h2 id="hai-chieu">Hai chiều học</h2>
        <p><strong>Anh → Việt</strong> kiểm tra bạn hiểu nghĩa khi đọc. <strong>Việt → Anh</strong> kiểm tra bạn nhớ được từ khi cần nói hoặc viết. Hai chiều có lịch ôn riêng: học chiều này không làm thay đổi chiều kia. Học cả hai chiều của cùng một từ vẫn chỉ tính là một từ mới.</p>

        <h2 id="nghi-hoc">Khi nghỉ học vài ngày</h2>
        <p>Thẻ đến hạn không mất đi. Khi quay lại với nhiều thẻ tồn, trang Hôm nay chia thành nhiều ngày theo số phút bạn có, tạm dừng từ mới và ưu tiên thẻ quá hạn lâu, hay quên.</p>

        <h2 id="csv">Nhập từ tệp CSV</h2>
        <p>Dòng đầu là tên cột. Hai cột bắt buộc là <code>word</code> và <code>meaning_vi</code>; các cột <code>pos</code>, <code>ipa</code>, <code>example_en</code>, <code>example_vi</code> không bắt buộc. Tệp tối đa 1 MB, 1000 dòng, mã hóa UTF-8. Bạn xem trước từng dòng; dòng lỗi không được ghi, dòng trùng được đánh dấu để bạn quyết định.</p>

        <h2 id="phim-tat">Phím tắt khi ôn</h2>
        <table>
          <thead><tr><th scope="col">Phím</th><th scope="col">Tác dụng</th></tr></thead>
          <tbody>
            <tr><td><kbd>Space</kbd></td><td>Lật thẻ</td></tr>
            <tr><td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd></td><td>Quên, Khó, Nhớ, Dễ</td></tr>
            <tr><td><kbd>Ctrl</kbd> <kbd>K</kbd></td><td>Mở ô tìm kiếm, tra từ điển</td></tr>
          </tbody>
        </table>
        <p>Phím tắt không hoạt động khi bạn đang gõ trong ô nhập.</p>

        <h2 id="hoi-dap">Câu hỏi thường gặp</h2>
        <details><summary>Sao lịch hẹn vài ngày nữa mới ôn? Tôi muốn học tiếp ngay.</summary><p>Từ bạn đã nhớ tốt được giãn ra để tiết kiệm thời gian. Bạn vẫn học tiếp được ngay: học chiều còn lại, bộ khác, luyện tập hoặc thêm từ mới, xem mục <a href="#hoc-them">Học thêm</a>.</p></details>
        <details><summary>Mỗi ngày nên học bao lâu?</summary><p>10 đến 20 phút đều đặn tốt hơn một buổi dài rồi nghỉ nhiều ngày. Ít nhất 5 lượt ôn mỗi ngày để giữ chuỗi ngày học.</p></details>
        <details><summary>Trình độ tôi chọn có phải kết quả kiểm tra không?</summary><p>Không. Đó là bạn tự đánh giá để hệ thống gợi ý bộ thẻ phù hợp. Bạn đổi được bất cứ lúc nào trong Thiết lập học.</p></details>
        <details><summary>Sao chép bộ của người khác có lấy luôn tiến độ của họ không?</summary><p>Không. Bản sao chỉ có nội dung thẻ và nguồn. Tiến độ của bạn bắt đầu từ đầu.</p></details>
        <details><summary>Bộ công khai của tôi có lộ tiến độ học không?</summary><p>Không. Người khác chỉ thấy nội dung thẻ và tên hiển thị của bạn.</p></details>
        <details><summary>Tôi quên mật khẩu thì sao?</summary><p>Dùng <Link href="/quen-mat-khau">Quên mật khẩu</Link>. Liên kết đặt lại có hiệu lực 30 phút và chỉ dùng được một lần.</p></details>
      </article>

      <aside className="toc sheet sheet-plain" aria-label="Mục lục">
        <p className="panel-title">Trong trang này</p>
        <ol id="toc">{TOC.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol>
      </aside>
    </div>
  );
}
