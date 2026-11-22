export const TOUR_STEPS = ['CHUA_BAT_DAU', 'HOC_BO_KHOI_DONG', 'XEM_TONG_KET', 'SAO_CHEP_THU_VIEN', 'MO_BO_SAO_CHEP', 'THEM_TU', 'HOAN_TAT', 'BO_QUA'];

export const LIBRARY_PATH = `/thu-vien?nguon=MAU&q=${encodeURIComponent('Đời sống')}`;

export const MISSIONS = [
  { key: 'learn', title: 'Học bộ khởi động', desc: 'Lật thẻ, tự chấm mức nhớ cho 8 từ đầu tiên.', steps: ['HOC_BO_KHOI_DONG'] },
  { key: 'review', title: 'Hiểu lịch ôn', desc: 'Xem mỗi từ sẽ quay lại vào lúc nào.', steps: ['XEM_TONG_KET'] },
  { key: 'copy', title: 'Lấy một bộ trong thư viện', desc: 'Sao chép bộ mẫu thành bộ của riêng bạn.', steps: ['SAO_CHEP_THU_VIEN', 'MO_BO_SAO_CHEP'] },
  { key: 'add', title: 'Thêm một từ của bạn', desc: 'Tuỳ chọn: tự tạo thẻ cho từ bạn gặp ngoài đời.', steps: ['THEM_TU'] }
];

const rank = step => Math.max(0, TOUR_STEPS.indexOf(step));

export function isTourActive(step) {
  return !!step && !['CHUA_BAT_DAU', 'HOAN_TAT', 'BO_QUA'].includes(step);
}

export function isForward(from, to) {
  return rank(to) > rank(from);
}

export function missionStates(step) {
  const finished = step === 'HOAN_TAT' || step === 'BO_QUA';
  return MISSIONS.map(mission => {
    const first = rank(mission.steps[0]);
    const last = rank(mission.steps[mission.steps.length - 1]);
    const now = rank(step);
    const status = finished || now > last ? 'done' : now >= first ? 'current' : 'todo';
    return { ...mission, status };
  });
}

export function missionNumber(step) {
  const index = MISSIONS.findIndex(mission => mission.steps.includes(step));
  return index < 0 ? null : index + 1;
}

export function continuePath(tour) {
  switch (tour?.buocHuongDan) {
    case 'HOC_BO_KHOI_DONG': return '/hom-nay';
    case 'XEM_TONG_KET':
    case 'SAO_CHEP_THU_VIEN': return LIBRARY_PATH;
    case 'MO_BO_SAO_CHEP': return '/bo-the';
    case 'THEM_TU': return `/bo-the/${tour.boSaoChepId || tour.boKhoiDongId || ''}`.replace(/\/$/, '');
    default: return '/hom-nay';
  }
}

function deckIdFrom(pathname, prefix) {
  const match = pathname.match(new RegExp(`^${prefix}/([0-9]+)/?$`));
  return match ? match[1] : null;
}

export function tourCue(tour, pathname, { sessionRated = 0 } = {}) {
  const step = tour?.buocHuongDan;
  if (!isTourActive(step) || !pathname) return null;
  const code = `Nhiệm vụ ${missionNumber(step)}/${MISSIONS.length}`;

  if (step === 'HOC_BO_KHOI_DONG') {
    if (pathname === '/hom-nay') {
      return {
        id: 'start-session', code, mode: 'force',
        targets: ['[data-tour="resume-session"]', '[data-tour="start-session"]'],
        title: 'Học phiên đầu tiên',
        body: 'Bộ “Khởi động — Một ngày của tôi” (8 từ) đã có sẵn trong Bộ của tôi. Bấm vào đây để học, chỉ khoảng 2 phút.'
      };
    }
    if (pathname === '/hoc-phien' && sessionRated < 1) {
      return {
        id: 'session-first-card', code, mode: 'force',
        targets: ['[data-tour="rates"]', '[data-tour="flip"]'],
        steps: {
          '[data-tour="flip"]': {
            title: 'Tự nhớ trước, rồi mới lật',
            body: 'Nhìn từ và thử nhớ nghĩa trong đầu. Chính lúc cố nhớ là lúc trí nhớ được rèn. Nhớ xong thì bấm “Lật thẻ”.'
          },
          '[data-tour="rates"]': {
            title: 'Chấm thật lòng mức nhớ',
            body: 'Quên: gặp lại ngay · Khó: ôn sớm · Nhớ: vài ngày nữa · Dễ: lâu hơn. Lịch ôn dựa vào đây.',
            compact: true
          }
        }
      };
    }
    if (pathname === '/hoc-tong-ket') return { id: 'reached-summary', advanceTo: 'XEM_TONG_KET' };
    return null;
  }

  if (step === 'XEM_TONG_KET') {
    if (pathname !== '/hoc-tong-ket') return null;
    return {
      id: 'next-review', code, mode: 'force', lockTarget: true,
      targets: ['[data-tour="next-review"]'],
      title: 'Mỗi từ có hẹn ôn riêng',
      body: 'Từ bạn nhớ tốt sẽ quay lại thưa dần, từ hay quên sẽ gặp lại sớm. Mỗi ngày chỉ cần mở “Hôm nay”, hệ thống đã xếp sẵn đúng những từ đến hạn.',
      action: { label: 'Hiểu rồi, sang thư viện', advanceTo: 'SAO_CHEP_THU_VIEN', go: LIBRARY_PATH }
    };
  }

  if (step === 'SAO_CHEP_THU_VIEN') {
    if (pathname === '/thu-vien') {
      return {
        id: 'library-pick', code, mode: 'force',
        targets: [
          `[data-tour-deck]:not([data-tour-deck="${tour.boKhoiDongNguonId || ''}"]):not([data-tour-copied]) [data-tour="deck-title"]`,
          `[data-tour-deck]:not([data-tour-deck="${tour.boKhoiDongNguonId || ''}"]) [data-tour="deck-title"]`
        ],
        title: 'Lấy bộ có sẵn, không cần tự gõ',
        body: 'Thư viện có nhiều bộ mẫu đã soạn kỹ: phiên âm, ví dụ, bản dịch. Mở thử bộ này.'
      };
    }
    if (deckIdFrom(pathname, '/thu-vien')) {
      return {
        id: 'library-copy', code, mode: 'force',
        targets: ['[data-tour="open-copy"]', '[data-tour="copy-deck"]'],
        advanceOn: '[data-tour="open-copy"]',
        title: 'Sao chép để học',
        body: 'Bản sao là của riêng bạn: có lịch ôn riêng, sửa hay thêm thẻ thoải mái mà không ảnh hưởng bộ gốc.'
      };
    }
    return null;
  }

  if (step === 'MO_BO_SAO_CHEP') {
    if (deckIdFrom(pathname, '/thu-vien')) {
      return {
        id: 'open-copy', code, mode: 'force',
        targets: ['[data-tour="open-copy"]'],
        title: 'Bộ đã vào Bộ của tôi',
        body: 'Mọi bộ bạn học đều nằm trong “Bộ của tôi”. Mở bộ vừa sao chép.'
      };
    }
    if (pathname === '/bo-the') {
      return {
        id: 'my-decks', code, mode: 'force',
        targets: [`[data-tour-deck="${tour.boSaoChepId || ''}"] [data-tour="deck-title"]`],
        title: 'Đây là Bộ của tôi',
        body: 'Bộ khởi động và bộ vừa sao chép đều ở đây. Mở bộ vừa sao chép.'
      };
    }
    const opened = deckIdFrom(pathname, '/bo-the');
    if (opened && (!tour.boSaoChepId || opened === tour.boSaoChepId)) return { id: 'opened-copy', advanceTo: 'THEM_TU' };
    return null;
  }

  if (step === 'THEM_TU') {
    if (!deckIdFrom(pathname, '/bo-the')) return null;
    return {
      id: 'add-card', code, mode: 'hint',
      targets: ['[data-tour="add-card"]'],
      title: 'Thêm từ của riêng bạn (tuỳ chọn)',
      body: 'Gặp từ mới ngoài đời? Bấm “Thêm thẻ” rồi gõ từ, từ điển sẽ điền sẵn nghĩa và ví dụ.',
      action: { label: 'Để lần khác', advanceTo: 'HOAN_TAT' }
    };
  }
  return null;
}

export function tourSignal(type, detail = {}) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('vocab:tour', { detail: { type, ...detail } }));
}
