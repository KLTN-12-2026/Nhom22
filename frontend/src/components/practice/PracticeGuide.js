import { Icon } from '@/components/ui';
import styles from './PracticeGuide.module.css';

export const GUIDE = {
  CHON_NGHIA: {
    sample: { prompt: 'receipt', promptEn: true, sub: '/rɪˈsiːt/ · noun', options: ['hoá đơn', 'biên lai', 'đơn hàng', 'phiếu giảm giá'], answer: 1 },
    steps: ['Đọc từ tiếng Anh, nghe phát âm nếu cần.', 'Chọn 1 trong 4 nghĩa tiếng Việt.', 'Mọi câu nằm trên một trang. Đổi đáp án thoải mái, làm xong bấm Nộp bài ở cuối.'],
    scoring: 'Đúng khi chọn đúng nghĩa. Mỗi câu 1 điểm.',
    tip: 'Loại trừ các nghĩa chắc chắn sai trước, rồi so hai phương án còn lại.'
  },
  CHON_TU: {
    sample: { prompt: 'biên lai', sub: 'noun', options: ['receipt', 'recipe', 'invoice', 'refund'], answer: 0, en: true },
    steps: ['Đọc nghĩa tiếng Việt và từ loại.', 'Chọn từ tiếng Anh đúng trong 4 phương án.', 'Chú ý các từ viết gần giống nhau.'],
    scoring: 'Đúng khi chọn đúng từ. Mỗi câu 1 điểm.',
    tip: 'Nhìn kỹ đuôi từ: receipt và recipe chỉ khác vài chữ.'
  },
  GHEP_TU: {
    sample: { pairs: [['deadline', 'hạn chót'], ['budget', 'ngân sách'], ['invoice', 'hoá đơn']] },
    steps: ['Mỗi dòng có một từ tiếng Anh ở bên trái.', 'Chọn nghĩa đúng trong ô thả xuống bên cạnh.', 'Làm hết các dòng rồi nộp bài.'],
    scoring: 'Chấm từng cặp. Mỗi câu gồm tối đa 5 cặp, đúng cặp nào tính cặp đó.',
    tip: 'Chọn các dòng chắc chắn trước, các dòng khó sẽ còn ít nghĩa để cân nhắc hơn.'
  },
  DIEN_CHO_TRONG: {
    sample: { sentence: ['Please keep the', 'for your records.'], hint: 'gợi ý: biên lai · noun', typed: 'receipt' },
    steps: ['Đọc cả câu ví dụ để hiểu ngữ cảnh.', 'Dùng gợi ý nghĩa và từ loại bên dưới câu.', 'Gõ từ còn thiếu vào ô nhập.'],
    scoring: 'Đúng khi gõ đúng từ, không phân biệt hoa thường và khoảng trắng thừa.',
    tip: 'Xác định vị trí trong câu cần danh từ, động từ hay tính từ trước khi gõ.'
  },
  NHAP_TU_THEO_NGHIA: {
    sample: { prompt: 'hạn chót', sub: 'noun', typed: 'deadlin', cursor: true },
    steps: ['Đọc nghĩa tiếng Việt và từ loại.', 'Gõ từ tiếng Anh tương ứng.', 'Kiểm tra chính tả trước khi chuyển câu.'],
    scoring: 'Phải gõ đúng chính tả. Sai chính tả được ghi vào sổ tay để luyện lại.',
    tip: 'Đọc thầm cách phát âm để nhớ cách viết.'
  },
  NGHE_VIET: {
    sample: { audio: true, typed: 'schedule', cursor: true },
    steps: ['Bấm Nghe để phát âm, hoặc Nghe chậm để nghe rõ từng âm. Nghe lại bao nhiêu lần cũng được.', 'Gõ lại từ vừa nghe vào ô nhập.', 'Dùng gợi ý từ loại nếu chưa chắc.'],
    scoring: 'Phải gõ đúng chính tả của từ đã nghe.',
    tip: 'Đeo tai nghe hoặc tăng âm lượng. Nghe chậm từng âm tiết rồi mới gõ.'
  },
  PHAN_BIET_CAP: {
    sample: { prompt: 'ảnh hưởng đến (động từ)', options: ['affect', 'effect'], answer: 0, en: true, pair: true },
    steps: ['Đọc nghĩa hoặc câu gợi ý.', 'Chọn 1 trong 2 từ bạn từng nhầm.', 'Xem giải thích sau khi nộp để nhớ điểm khác nhau.'],
    scoring: 'Đúng khi chọn đúng từ. Chỉ dùng các cặp bạn từng chọn nhầm ở bài trước.',
    tip: 'Nếu chưa có cặp nào, hãy làm Chọn nghĩa hoặc Chọn từ trước để hệ thống ghi nhận.'
  },
  TONG_HOP: {
    sample: { mixed: ['Chọn nghĩa', 'Điền chỗ trống', 'Nghe viết', 'Ghép từ'] },
    steps: ['Mỗi câu có thể là một dạng khác nhau, đọc kỹ yêu cầu ở đầu câu.', 'Làm hết rồi nộp một lần.', 'Kết quả được chia theo từng kỹ năng.'],
    scoring: 'Chấm theo luật của từng dạng. Kết quả cập nhật mức làm chủ từng kỹ năng.',
    tip: 'Phù hợp để ôn tập cuối tuần hoặc kiểm tra tổng quát.'
  }
};

const Options = ({ s }) => (
  <div className={`${styles.opts}${s.pair ? ` ${styles.pair}` : ''}`}>
    {s.options.map((o, i) => (
      <span key={o} className={`${styles.opt}${i === s.answer ? ` ${styles.on}` : ''}`} lang={s.en ? 'en' : undefined}>
        <i aria-hidden="true">{String.fromCharCode(65 + i)}</i>{o}
      </span>
    ))}
  </div>
);

const TypeBox = ({ s }) => (
  <span className={styles.input}>{s.typed}{s.cursor && <b className={styles.caret} aria-hidden="true" />}</span>
);

export function PracticeSample({ type, mini = false }) {
  const s = GUIDE[type]?.sample;
  if (!s) return null;
  let body;
  if (s.pairs) {
    body = (
      <div className={styles.match}>
        {s.pairs.map(([en, vi], i) => (
          <div key={en} className={styles.matchRow}>
            <span className={styles.word} lang="en">{en}</span>
            <span className={`${styles.select}${i < 2 ? ` ${styles.on}` : ''}`}>{i < 2 ? vi : 'Chọn nghĩa…'}<b aria-hidden="true">▾</b></span>
          </div>
        ))}
      </div>
    );
  } else if (s.sentence) {
    body = <>
      <p className={styles.sentence} lang="en">{s.sentence[0]} <TypeBox s={s} /> {s.sentence[1]}</p>
      <p className={styles.sub}>{s.hint}</p>
    </>;
  } else if (s.audio) {
    body = <>
      <span className={styles.listen}><span className={styles.speaker}><Icon name="volume" />Nghe</span><span className={styles.slow}>Nghe chậm</span></span>
      <TypeBox s={s} />
    </>;
  } else if (s.mixed) {
    body = <div className={styles.mixed}>{s.mixed.map((m, i) => <span key={m} style={{ '--i': i }}>{m}</span>)}</div>;
  } else {
    body = <>
      <p className={styles.prompt} lang={s.promptEn ? 'en' : undefined}>{s.prompt}</p>
      {s.sub && <p className={styles.sub}>{s.sub}</p>}
      {s.options ? <Options s={s} /> : <TypeBox s={s} />}
    </>;
  }
  return <div className={`${styles.sample}${mini ? ` ${styles.mini}` : ''}`} aria-hidden={mini ? 'true' : undefined}>{body}</div>;
}

export function PracticeHowTo({ type, name, skill }) {
  const g = GUIDE[type];
  if (!g) return null;
  return (
    <section className={styles.howto} aria-labelledby="howto-title" aria-live="polite">
      <div className={styles.howHead}>
        <h2 id="howto-title"><Icon name="info" />Hướng dẫn: {name}</h2>
        <span className={styles.skill}>Kỹ năng: {skill}</span>
      </div>
      <div className={styles.howGrid}>
        <div>
          <p className={styles.label}>Đề mẫu</p>
          <PracticeSample type={type} />
        </div>
        <div className={styles.howText}>
          <p className={styles.label}>Cách làm</p>
          <ol className={styles.steps}>{g.steps.map(s => <li key={s}>{s}</li>)}</ol>
          <p className={styles.label}>Chấm điểm</p>
          <p className={styles.small}>{g.scoring}</p>
          <p className={styles.tip}><Icon name="sparkles" />{g.tip}</p>
        </div>
      </div>
    </section>
  );
}
