import { Icon } from '@/components/ui';
import styles from './PracticeGuide.module.css';

export const GUIDE = {
  FLASHCARD: {
    sample: {
      flashcard: true,
      prompt: 'receipt',
      sub: '/rɪˈsiːt/ · noun',
      meaning: 'hoá đơn, biên lai',
      ratings: ['Quên', 'Khó', 'Tốt', 'Dễ']
    },
    steps: [
      'Đọc từ tiếng Anh và phát âm ở mặt trước thẻ.',
      'Bấm Lật thẻ để xem nghĩa tiếng Việt, câu ví dụ và ngữ cảnh.',
      'Tự đánh giá mức độ nhớ theo 4 mức: Quên, Khó, Tốt hoặc Dễ để thuật toán SRS xếp lịch ôn.'
    ],
    scoring: 'Cập nhật chu kỳ ngắt quãng SRS tự động cho từng thẻ để củng cố trí nhớ dài hạn.',
    tip: 'Đánh giá trung thực để hệ thống nhắc lại đúng thời điểm bạn sắp quên.'
  },
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
    steps: [
      'Chạm từ tiếng Anh và nghĩa tiếng Việt tương ứng trên bảng ma trận để nối cặp.',
      'Nối đúng cặp sẽ được +25 điểm và nghe phát âm tiếng Anh chuẩn từ trình duyệt.',
      'Nối hết tất cả các cặp trước khi hết giờ để nhận thêm điểm thưởng.'
    ],
    scoring: 'Chấm từng cặp. Nối đúng mỗi cặp được +25 điểm.',
    tip: 'Chọn các từ bạn chắc chắn trước để thu hẹp số lượng thẻ cần nối.'
  },
  DIEN_CHO_TRONG: {
    sample: {
      hini: true,
      sentence: 'The floor is covered with',
      after: '.',
      blank: '_______',
      hint: 'Ngữ cảnh: Sàn nhà bị phủ đầy bụi bẩn.',
      timer: '20s',
      options: ['dirt', 'drawer', 'furniture', 'microscope'],
      answer: 0
    },
    steps: [
      'Đọc câu ví dụ có chỗ trống và ngữ cảnh tiếng Việt.',
      'Chọn 1 trong 4 từ (A, B, C, D) trước khi đồng hồ 20 giây kết thúc.',
      'Xem phân tích chi tiết đáp án tức thì và có thể luyện lại các câu sai ở cuối bài.'
    ],
    scoring: 'Đúng khi chọn đúng từ. Trả lời đúng được +10 điểm. Hết 20s tính là chưa đúng.',
    tip: 'Chú ý ngữ cảnh tiếng Việt và loại từ cần điền vào câu.'
  },
  NHAP_TU_THEO_NGHIA: {
    sample: { prompt: 'hạn chót', sub: 'noun', typed: 'deadlin', cursor: true },
    steps: ['Đọc nghĩa tiếng Việt và từ loại.', 'Gõ từ tiếng Anh tương ứng.', 'Kiểm tra chính tả trước khi chuyển câu.'],
    scoring: 'Phải gõ đúng chính tả. Sai chính tả được ghi vào sổ tay để luyện lại.',
    tip: 'Đọc thầm cách phát âm để nhớ cách viết.'
  },
  NGHE_VIET: {
    sample: { audio: true, typed: 'schedule', cursor: true },
    steps: [
      'Bấm Nghe để nghe phát âm tiếng Anh chuẩn từ trình duyệt, hoặc Nghe chậm để nghe rõ từng âm tiết.',
      'Gõ lại từ vừa nghe vào ô nhập.',
      'Dùng gợi ý từ loại nếu chưa chắc.'
    ],
    scoring: 'Phải gõ đúng chính tả của từ đã nghe.',
    tip: 'Bật loa hoặc đeo tai nghe. Có thể bấm Nghe chậm nhiều lần để nắm chắc các âm gió và đuôi từ.'
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
  if (s.flashcard) {
    body = (
      <div className={styles.fcBox}>
        <div className={styles.fcCard}>
          <span className={styles.fcPrompt}>{s.prompt}</span>
          <span className={styles.fcSub}>{s.sub}</span>
          <span className={styles.fcMeaning}>{s.meaning}</span>
        </div>
        <div className={styles.fcRatings}>
          {s.ratings.map((r, i) => (
            <span key={r} className={`${styles.fcRate}${i === 2 ? ` ${styles.fcRateOn}` : ''}`}>{r}</span>
          ))}
        </div>
      </div>
    );
  } else if (s.hini) {
    body = (
      <div className={styles.hiniWrap}>
        <div className={styles.hiniTop}>
          <p className={styles.sentence} lang="en">
            {s.sentence} <span className={styles.hiniBlank}>{s.blank}</span>{s.after}
          </p>
          <span className={styles.hiniTimer}>{s.timer}</span>
        </div>
        {s.hint && <p className={styles.sub}>{s.hint}</p>}
        <div className={styles.opts}>
          {s.options.map((o, i) => (
            <span key={o} className={`${styles.opt}${i === s.answer ? ` ${styles.on}` : ''}`} lang="en">
              <i aria-hidden="true">{String.fromCharCode(65 + i)}</i>{o}
            </span>
          ))}
        </div>
      </div>
    );
  } else if (s.pairs) {
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
