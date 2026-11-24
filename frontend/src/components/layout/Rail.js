'use client';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import { NavQuota } from '@/components/billing/PlanAccess';
import { DEFAULT_SKIN } from '@/lib/skins.mjs';

export const NAV = [
  { group: 'Học tập', items: [
    { key: 'today', label: 'Hôm nay', icon: 'today', href: '/hom-nay', count: 'due' },
    { key: 'decks', label: 'Bộ của tôi', icon: 'decks', href: '/bo-the', subs: [{ key: 'publish-requests', label: 'Yêu cầu công khai', icon: 'copy', href: '/yeu-cau-cong-khai' }] },
    { key: 'library', label: 'Thư viện', icon: 'library', href: '/thu-vien' },
    { key: 'dictionary', label: 'Từ điển', icon: 'book', href: '/tu-dien' },
    { key: 'practice', label: 'Luyện tập', icon: 'practice', href: '/luyen-tap', subs: [{ key: 'practice-history', label: 'Lịch sử luyện tập', icon: 'clock', href: '/luyen-tap-lich-su' }] },
    { key: 'notebook', label: 'Sổ tay', icon: 'notebook', href: '/so-tay' }
  ] },
  { group: 'Công cụ AI', items: [
    { key: 'ai-workshop', label: 'Xưởng thẻ AI', icon: 'sparkles', href: '/ai-xuong-the', feature: 'AI', subs: [{ key: 'ai-history', label: 'Lịch sử AI', icon: 'clock', href: '/ai-lich-su' }] },
    { key: 'ai-sentence', label: 'Viết câu', icon: 'edit', href: '/ai-viet-cau', feature: 'AI' },
    { key: 'pronunciation', label: 'Phát âm', icon: 'mic', href: '/phat-am', feature: 'PHAT_AM', subs: [{ key: 'pronunciation-history', label: 'Lịch sử phát âm', icon: 'clock', href: '/phat-am-lich-su' }] }
  ] },
  { group: 'Tiến bộ', items: [
    { key: 'stats', label: 'Thống kê', icon: 'chart', href: '/thong-ke' },
    { key: 'recommendations', label: 'Gợi ý ôn tập', icon: 'target', href: '/goi-y' },
    { key: 'mastery-map', label: 'Bản đồ làm chủ', icon: 'globe', href: '/ban-do-lam-chu' },
    { key: 'weekly-summary', label: 'Tổng kết tuần', icon: 'calendar', href: '/tong-ket-tuan' },
    { key: 'achievements', label: 'Thành tích', icon: 'shield', href: '/thanh-tich' },
    { key: 'leaderboard', label: 'Bảng xếp hạng', icon: 'star', href: '/bang-xep-hang' }
  ] }
];

const PIN_KEY = 'vocab:rail-pinned';
const FOLD_KEY = 'vocab:rail-folded';
const readPinned = () => { try { return localStorage.getItem(PIN_KEY) === '1'; } catch { return false; } };
const pinSubscribe = listener => {
  window.addEventListener('vocab-rail-pin', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('vocab-rail-pin', listener);
    window.removeEventListener('storage', listener);
  };
};
const readFolded = () => { try { return localStorage.getItem(FOLD_KEY) || ''; } catch { return ''; } };
const foldSubscribe = listener => {
  window.addEventListener('vocab-rail-fold', listener);
  return () => window.removeEventListener('vocab-rail-fold', listener);
};
const parseFolded = raw => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const fold = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const PARTICLES = Array.from({ length: 9 }, (_, i) => ({ '--x': `${8 + i * 29}px`, '--s': `${3 + (i * 7) % 5}px`, '--t': `${5 + (i * 3) % 6}s`, '--d': `-${(i * 1.3).toFixed(1)}s`, '--dx': `${i % 2 ? 12 : -12}px` }));

function Mark({ text, query }) {
  if (!query) return text;
  const at = fold(text).indexOf(fold(query));
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + query.length)}</mark>{text.slice(at + query.length)}</>;
}

function useDueCount(enabled) {
  const { data } = useQuery({ queryKey: ['learning-today-count'], queryFn: () => apiFetch('/api/v1/learning/today'), enabled, staleTime: 60000, retry: false });
  return data ? (data.soQuaHan || 0) + (data.soDenHan || 0) : 0;
}

function useSkinName(enabled) {
  const { data } = useQuery({ queryKey: ['themes'], queryFn: () => apiFetch('/api/v1/me/themes'), enabled, staleTime: 600000 });
  if (!data?.giaoDienMa || data.giaoDienMa === DEFAULT_SKIN) return null;
  return data.danhSach?.find(t => t.ma === data.giaoDienMa)?.ten || null;
}

export function Rail({ groups, user, isActive, foot, menuOpen }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const bubbleRef = useRef(null);
  const findRef = useRef(null);
  const hoverTimer = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const pinned = useSyncExternalStore(pinSubscribe, readPinned, () => false);
  const foldedRaw = useSyncExternalStore(foldSubscribe, readFolded, () => '');
  const folded = parseFolded(foldedRaw);
  const due = useDueCount(Boolean(user));
  const skinName = useSkinName(Boolean(user));
  const open = pinned || hovered || focused || menuOpen || Boolean(query);

  const all = groups;
  const q = query.trim();
  const shown = all.map((g, index) => {
    const items = q ? g.items.filter(it => fold(it.label).includes(fold(q)) || (it.subs || []).some(s => fold(s.label).includes(fold(q)))) : g.items;
    const hasActive = g.items.some(it => isActive(it.href) || (it.subs || []).some(s => isActive(s.href)));
    const closed = !q && !hasActive && (folded?.[g.group] ?? Boolean(g.folded));
    return { ...g, index, items, closed };
  }).filter(g => g.items.length);
  const activeKey = all.flatMap(g => g.items).find(it => isActive(it.href) || (it.subs || []).some(s => isActive(s.href)))?.key;

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    const onKey = event => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
      if (!findRef.current || findRef.current.offsetParent === null) return;
      event.preventDefault();
      findRef.current.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const scroll = scrollRef.current;
    if (!bubble || !scroll) return undefined;
    const place = () => {
      const row = scroll.querySelector('.rail-item[aria-current="page"]');
      if (!row || row.offsetParent === null) { bubble.style.opacity = '0'; return; }
      bubble.style.opacity = '1';
      bubble.style.transform = `translateY(${row.offsetTop}px)`;
    };
    place();
    const timer = setTimeout(place, 260);
    return () => clearTimeout(timer);
  }, [activeKey, open, q, foldedRaw]);

  useEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble || !activeKey) return;
    bubble.classList.remove('is-pop');
    void bubble.offsetWidth;
    bubble.classList.add('is-pop');
  }, [activeKey]);

  useEffect(() => {
    const row = scrollRef.current?.querySelector('.rail-item[aria-current="page"]');
    if (row) row.scrollIntoView({ block: 'nearest' });
  }, [activeKey]);

  const togglePin = () => {
    try { localStorage.setItem(PIN_KEY, pinned ? '0' : '1'); } catch { }
    window.dispatchEvent(new Event('vocab-rail-pin'));
  };
  const toggleGroup = (name, closed) => {
    const next = { ...(folded || {}), [name]: !closed };
    try { localStorage.setItem(FOLD_KEY, JSON.stringify(next)); } catch { }
    window.dispatchEvent(new Event('vocab-rail-fold'));
  };
  const onEnter = () => { clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setHovered(true), 90); };
  const onLeave = () => { clearTimeout(hoverTimer.current); setHovered(false); };
  const onBlur = event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); };
  const onFindKey = event => {
    if (event.key === 'Escape') { setQuery(''); event.currentTarget.blur(); }
    if (event.key === 'Enter') {
      const first = shown[0]?.items[0];
      if (!first) { router.push(`/tu-dien?q=${encodeURIComponent(q)}`); return; }
      const sub = !fold(first.label).includes(fold(q)) && (first.subs || []).find(s => fold(s.label).includes(fold(q)));
      router.push((sub || first).href);
      setQuery('');
      event.currentTarget.blur();
    }
  };

  const meta = it => {
    if (it.count === 'due' && due > 0) return <span className="rail-count" title={`${due} thẻ cần ôn hôm nay`}>{due > 99 ? '99+' : due}</span>;
    if (it.feature && user) return <NavQuota feature={it.feature} />;
    return null;
  };

  return (
    <div className="app-rail" data-pinned={pinned || undefined}>
      <nav className="rail" data-open={open || undefined} aria-label="Điều hướng chính" onMouseEnter={onEnter} onMouseLeave={onLeave}
        onFocus={event => { if (event.target.matches(':focus-visible') || event.target === findRef.current) setFocused(true); }} onBlur={onBlur}>
        <div className="rail-top" data-plain={skinName ? undefined : true}>
          {skinName && <div className="rail-scene" aria-hidden="true">{PARTICLES.map((style, i) => <i key={i} style={style} />)}</div>}
          {skinName && <p className="rail-skin"><b aria-hidden="true" />{skinName}</p>}
          <label className="rail-find">
            <Icon name="search" />
            <input ref={findRef} type="search" value={query} placeholder="Tìm trong menu" aria-label="Tìm trang trong menu" autoComplete="off"
              onChange={event => setQuery(event.target.value)} onKeyDown={onFindKey} />
            <kbd aria-hidden="true">/</kbd>
          </label>
          <button type="button" className="rail-pin" aria-pressed={pinned} aria-label={pinned ? 'Bỏ ghim thanh điều hướng' : 'Ghim mở thanh điều hướng'} title={pinned ? 'Bỏ ghim' : 'Ghim mở'} onClick={togglePin}>
            <Icon name="pin" />
          </button>
        </div>

        <div id="sidebar-links" ref={scrollRef} className="rail-scroll">
          <span ref={bubbleRef} className="rail-bubble" aria-hidden="true" />
          {shown.map(g => (
            <div key={g.group} className="rail-group" data-closed={g.closed || undefined}>
              <button type="button" className="rail-group-title" aria-expanded={!g.closed} tabIndex={open ? 0 : -1} onClick={() => toggleGroup(g.group, g.closed)}>
                <span className="rail-no" aria-hidden="true">{g.index + 1}</span>{g.group}<Icon name="chevron" className="rail-chev" />
              </button>
              <div className="rail-items">
                {g.items.map(it => {
                  const subActive = (it.subs || []).some(s => isActive(s.href));
                  const active = isActive(it.href) || subActive;
                  const showSubs = it.subs && (active || (q && it.subs.some(s => fold(s.label).includes(fold(q)))));
                  const extra = meta(it);
                  return (
                    <div key={it.key}>
                      <Link className="rail-item" href={it.href} title={it.label} aria-current={active ? 'page' : undefined} onClick={() => setQuery('')}>
                        <Icon name={it.icon} />
                        {it.count === 'due' && due > 0 && <span className="rail-dot" aria-hidden="true" />}
                        <span className="rail-label"><Mark text={it.label} query={q} /></span>
                        {extra && <span className="rail-extra">{extra}</span>}
                      </Link>
                      {showSubs && (
                        <div className="rail-subs">
                          {it.subs.map(s => (
                            <Link key={s.key} href={s.href} className="rail-sub" aria-current={isActive(s.href) ? 'page' : undefined} onClick={() => setQuery('')}>
                              <Mark text={s.label} query={q} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {!shown.length && (
            <p className="rail-empty">Không có trang nào khớp. <Link href={`/tu-dien?q=${encodeURIComponent(q)}`} onClick={() => setQuery('')}>Tra “{q}” trong từ điển</Link></p>
          )}
        </div>

        {foot && <div className="rail-foot">{foot}</div>}
      </nav>
    </div>
  );
}
