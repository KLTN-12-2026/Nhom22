'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useMe } from '@/hooks/useMe';
import { cardFromSense } from '@/lib/dictionary.mjs';
import { COLLAPSED_KEY, HIDDEN_ROUTES, MUC_EVENT, NO_LOOKUP_ROUTES, hardWords, lookupCandidate, mucCelebrate, readMucName, readMucSettings, routeIn, routeTip, todayLine, todoCount } from '@/lib/mascot.mjs';
import { WordCombobox } from '@/components/dictionary/WordCombobox';
import { AddToDeckDialog } from '@/components/dictionary/AddToDeckDialog';
import { MucLookupResult } from './MucLookupResult';
import { useMucPosition } from './useMucPosition';

const MOOD_MS = 2400;
const GREET_KEY = 'vocab:muc:greeted';
const TIPS_KEY = 'vocab:muc:tips';

function sessionList(key) {
  try { return JSON.parse(sessionStorage.getItem(key)) || []; } catch { return []; }
}

function sessionAdd(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify([...sessionList(key), value].slice(-50))); } catch {}
}

export function MucCompanion() {
  const pathname = usePathname() || '/';
  if (routeIn(pathname, HIDDEN_ROUTES)) return null;
  return <Muc pathname={pathname} />;
}

function Muc({ pathname }) {
  const client = useQueryClient();
  const me = useMe();
  const user = me.data && !me.isError ? me.data : null;
  const [svg, setSvg] = useState('');
  const [name, setName] = useState(readMucName);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => readMucSettings().collapsed);
  const [selectLookup, setSelectLookup] = useState(() => readMucSettings().selectLookup);
  const [transient, setTransient] = useState(null);
  const [bubble, setBubble] = useState(null);
  const [pending, setPending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lookupTerm, setLookupTerm] = useState('');
  const [lookupDraft, setLookupDraft] = useState('');
  const [chip, setChip] = useState(null);
  const [pop, setPop] = useState(null);
  const [card, setCard] = useState(null);
  const [cardKey, setCardKey] = useState(0);
  const hostRef = useRef(null);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const bubbleRef = useRef(null);
  const timers = useRef({});
  const requests = useRef(0);
  const combo = useRef({ right: 0, wrong: 0 });
  const prevPlan = useRef(null);
  const nameRef = useRef(name);

  const today = useQuery({ queryKey: ['learning-today'], queryFn: () => apiFetch('/api/v1/learning/today'), enabled: !!user, staleTime: 60000 });
  const notebook = useQuery({ queryKey: ['notebook', 'muc'], queryFn: () => apiFetch('/api/v1/notebook?size=50'), enabled: !!user && open, staleTime: 60000 });
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: () => apiFetch('/api/v1/challenges'), enabled: !!user && open, staleTime: 60000 });
  const badges = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges'), enabled: !!user, staleTime: 60000 });
  const plan = today.data;

  const fill = useCallback(text => (text || '').replaceAll('{ten}', nameRef.current), []);

  const say = useCallback((text, mood = 'wave', ttl = 5200) => {
    clearTimeout(timers.current.say);
    clearTimeout(timers.current.mood);
    setTransient(mood);
    setBubble(text ? fill(text) : null);
    timers.current.say = setTimeout(() => { setBubble(null); setTransient(null); }, text ? ttl : MOOD_MS);
  }, [fill]);

  const mood = useCallback(value => {
    clearTimeout(timers.current.mood);
    setTransient(value);
    timers.current.mood = setTimeout(() => setTransient(null), MOOD_MS);
  }, []);

  useEffect(() => { nameRef.current = name; }, [name]);

  useEffect(() => {
    let alive = true;
    fetch('/mascot.svg').then(res => (res.ok ? res.text() : '')).then(text => { if (alive) setSvg(text); }).catch(() => {});
    const all = timers.current;
    return () => { alive = false; Object.values(all).forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const onMuc = event => {
      const detail = event.detail || {};
      if (detail.type === 'say') say(detail.text, detail.mood, detail.ttl);
      else if (detail.type === 'mood') mood(detail.mood);
      else if (detail.type === 'tip' && detail.text) {
        const key = `${location.pathname}|${detail.text}`;
        if (sessionList(TIPS_KEY).includes(key)) return;
        sessionAdd(TIPS_KEY, key);
        say(detail.text, 'wave', 7000);
      } else if (detail.type === 'review') {
        if (detail.correct) {
          combo.current.right += 1;
          if (combo.current.right % 5 === 0) say(`${combo.current.right} thẻ liền không quên! 💪`, 'success', 3200);
          else mood('success');
        } else {
          combo.current.right = 0;
          combo.current.wrong += 1;
          if (combo.current.wrong % 3 === 1) say('Không sao, thẻ này sẽ quay lại sớm thôi.', 'error', 3200);
          else mood('error');
        }
      } else if (detail.type === 'activity') {
        client.invalidateQueries({ queryKey: ['learning-today'] });
        client.invalidateQueries({ queryKey: ['badges'] });
        client.invalidateQueries({ queryKey: ['notebook'] });
        client.invalidateQueries({ queryKey: ['challenges'] });
        client.invalidateQueries({ queryKey: ['learning-streak'] });
      } else if (detail.type === 'name') setName(detail.name);
      else if (detail.type === 'settings') { const next = readMucSettings(); setCollapsed(next.collapsed); setSelectLookup(next.selectLookup); }
    };
    const onLegacy = event => {
      const state = event.detail?.state;
      if (state === 'start' || state === 'end') {
        requests.current = Math.max(0, requests.current + (state === 'start' ? 1 : -1));
        setPending(requests.current > 0);
      } else if (state === 'speaking' || state === 'quiet') setSpeaking(state === 'speaking');
    };
    window.addEventListener(MUC_EVENT, onMuc);
    window.addEventListener('vocab:mascot', onLegacy);
    return () => { window.removeEventListener(MUC_EVENT, onMuc); window.removeEventListener('vocab:mascot', onLegacy); };
  }, [say, mood, client]);

  useEffect(() => {
    combo.current = { right: 0, wrong: 0 };
    const tip = routeTip(pathname);
    if (tip) window.dispatchEvent(new CustomEvent(MUC_EVENT, { detail: { type: 'tip', text: tip } }));
  }, [pathname]);

  useEffect(() => {
    if (!plan) return;
    const prev = prevPlan.current;
    prevPlan.current = plan;
    if (prev && prev.ngay === plan.ngay && !prev.homNayDaTinhChuoi && plan.homNayDaTinhChuoi && plan.chuoiNgay > 0) {
      mucCelebrate(`Chuỗi ${plan.chuoiNgay} ngày! 🔥 Giữ lửa tiếp nhé.`, 6000);
      return;
    }
    if (prev) return;
    const stamp = `${user?.id}|${plan.ngay}`;
    if (sessionList(GREET_KEY).includes(stamp)) return;
    sessionAdd(GREET_KEY, stamp);
    const line = todayLine(plan, nameRef.current);
    if (line) window.dispatchEvent(new CustomEvent(MUC_EVENT, { detail: { type: 'say', text: line, mood: 'wave', ttl: 7000 } }));
  }, [plan, user?.id]);

  useEffect(() => {
    if (!user || !badges.data) return;
    const key = `vocab:muc:badges:${user.id}`;
    const earned = badges.data.filter(badge => badge.daNhan).map(badge => badge.id);
    let known = null;
    try { known = JSON.parse(localStorage.getItem(key)); } catch {}
    try { localStorage.setItem(key, JSON.stringify(earned)); } catch {}
    if (!Array.isArray(known)) return;
    const fresh = badges.data.find(badge => badge.daNhan && !known.includes(badge.id));
    if (fresh) mucCelebrate(`Huy hiệu mới: “${fresh.ten}”! 🏅`, 7000);
  }, [badges.data, user]);

  useEffect(() => {
    const update = () => setDialogOpen(!!document.querySelector('dialog[open]'));
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true });
    update();
    return () => observer.disconnect();
  }, []);

  const lookupBlocked = !selectLookup || routeIn(pathname, NO_LOOKUP_ROUTES);
  useEffect(() => {
    if (lookupBlocked) return undefined;
    let timer;
    const read = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) { setChip(null); return; }
      if (document.body.classList.contains('focus-mode')) return;
      const node = selection.anchorNode?.nodeType === 1 ? selection.anchorNode : selection.anchorNode?.parentElement;
      if (!node || node.closest('input, textarea, select, [contenteditable="true"], .muc-companion, .muc-pop, .muc-chip, dialog')) return;
      const term = lookupCandidate(selection.toString());
      if (!term) { setChip(null); return; }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      setChip({ term, top: rect.bottom + 8, left: rect.left + rect.width / 2, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width } });
    };
    const onChange = () => { clearTimeout(timer); timer = setTimeout(read, 320); };
    const onScroll = () => setChip(null);
    const onKey = event => { if (event.key === 'Escape') { setChip(null); setPop(null); } };
    document.addEventListener('selectionchange', onChange);
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); document.removeEventListener('selectionchange', onChange); window.removeEventListener('scroll', onScroll, { capture: true }); document.removeEventListener('keydown', onKey); };
  }, [lookupBlocked]);

  useEffect(() => {
    if (!pop) return undefined;
    const onDown = event => { if (!event.target.closest('.muc-pop, .muc-chip, dialog')) setPop(null); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [pop]);

  const { resetPosition, restore } = useMucPosition({ hostRef, toggleRef, panelRef, bubbleRef, ready: !!svg, onDragStart: () => setOpen(false) });

  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => { if (event.key === 'Escape' && !event.defaultPrevented) { setOpen(false); toggleRef.current?.focus(); } };
    const onDown = event => { if (hostRef.current && !hostRef.current.contains(event.target) && !event.target.closest('dialog')) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  const toggle = event => {
    const dragged = event.currentTarget.dataset.dragged === 'true';
    delete event.currentTarget.dataset.dragged;
    if (dragged && event.detail !== 0) return;
    if (collapsed) { setCollapsed(false); try { localStorage.setItem(COLLAPSED_KEY, 'false'); } catch {} }
    setOpen(value => !value);
    requestAnimationFrame(restore);
    mood('wave');
    if (user) client.invalidateQueries({ queryKey: ['learning-today'] });
  };

  const collapse = () => {
    setCollapsed(true); setOpen(false);
    try { localStorage.setItem(COLLAPSED_KEY, 'true'); } catch {}
  };

  const saveCard = (entry, sense) => {
    if (!user) return;
    setCardKey(k => k + 1);
    setCard(cardFromSense(entry, sense));
    setPop(null);
  };

  const openPop = () => {
    if (!chip) return;
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, chip.left - width / 2));
    const below = window.innerHeight - chip.rect.bottom;
    setPop({ term: chip.term, left, width, ...(below > 280 ? { top: chip.rect.bottom + 8 } : { bottom: window.innerHeight - chip.rect.top + 8 }) });
    setChip(null);
    mood('wave');
  };

  const baseMood = speaking ? 'speaking' : pending ? 'thinking' : 'idle';
  const state = transient || baseMood;
  const todo = user ? todoCount(plan) : 0;
  const due = plan ? (plan.soQuaHan || 0) + (plan.soDenHan || 0) : 0;
  const goal = plan?.phutMoiNgay ? Math.min(1, (plan.daHocHomNay?.soPhut || 0) / plan.phutMoiNgay) : 0;
  const words = hardWords(notebook.data);
  const activeChallenges = (challenges.data || []).filter(item => !item.hoanThanhAt).slice(0, 2);
  const studyHref = plan?.phienDangDo?.soChuaTraLoi > 0 ? `/hoc-phien?id=${plan.phienDangDo.id}` : '/hoc';

  return <>
    <aside ref={hostRef} className="muc-companion" hidden={dialogOpen} data-muc-state={state} data-collapsed={String(collapsed)} data-bubble={bubble && !open ? 'on' : 'off'} aria-label={`${name}, bạn học từ vựng`}>
      <div ref={panelRef} className="muc-panel" id="muc-panel" hidden={!open}>
        <div className="muc-panel-head">
          <h2>{user ? `${name} · việc hôm nay` : `${name} · bạn học`}</h2>
          <button className="btn btn-quiet btn-icon" type="button" aria-label={`Đóng bảng ${name}`} onClick={() => { setOpen(false); toggleRef.current?.focus(); }}>×</button>
        </div>

        {user && <>
          {today.isPending ? <p className="small muted" role="status">Đang xem lịch học…</p>
            : today.isError ? <p className="small muted">Chưa tải được lịch hôm nay.</p>
              : plan && <>
                <section className="muc-sec" aria-label="Mục tiêu hôm nay">
                  <div className="muc-row">
                    <span className="muc-label">Mục tiêu ngày</span>
                    <span className="muc-num">{plan.daHocHomNay?.soPhut || 0}/{plan.phutMoiNgay} phút</span>
                  </div>
                  <div className="meter is-progress" role="progressbar" aria-label="Tiến độ mục tiêu ngày" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goal * 100)}><span style={{ '--v': goal }} /></div>
                </section>

                <section className="muc-sec muc-due" aria-label="Thẻ đến hạn">
                  <p className="muc-line">{todayLine(plan, name)}</p>
                  {(due > 0 || plan.soMoiConLai > 0 || plan.phienDangDo?.soChuaTraLoi > 0)
                    ? <Link className="btn btn-accent" href={studyHref} onClick={() => setOpen(false)}>{plan.phienDangDo?.soChuaTraLoi > 0 ? 'Học tiếp' : 'Học ngay'}{due > 0 && <span className="muc-badge">{due}</span>}</Link>
                    : !plan.tongSoThe && <Link className="btn btn-secondary" href="/thu-vien" onClick={() => setOpen(false)}>Chọn bộ trong Thư viện</Link>}
                </section>
              </>}

          <section className="muc-sec" aria-label="Từ hay sai">
            <div className="muc-row"><span className="muc-label">Từ hay sai nhất</span><Link className="small" href="/so-tay" onClick={() => setOpen(false)}>Sổ tay</Link></div>
            {notebook.isPending ? <p className="small muted" role="status">Đang tải…</p>
              : words.length === 0 ? <p className="small muted">Chưa có từ nào trong sổ tay. Tốt lắm!</p>
                : <>
                  <ul className="muc-words">{words.map(word => <li key={word.theId}><span lang="en">{word.tu}</span><span className="muc-mean">{word.nghiaVi}</span>{word.soLanQuen > 0 && <span className="muc-count">quên {word.soLanQuen}×</span>}</li>)}</ul>
                  <Link className="btn btn-secondary btn-sm" href="/luyen-tap?nguon=SO_TAY" onClick={() => setOpen(false)}>Luyện các từ này</Link>
                </>}
          </section>

          {activeChallenges.length > 0 && <section className="muc-sec" aria-label="Thử thách đang chạy">
            <div className="muc-row"><span className="muc-label">Thử thách</span><Link className="small" href="/thanh-tich" onClick={() => setOpen(false)}>Tất cả</Link></div>
            {activeChallenges.map(item => <div key={item.id} className="muc-ch">
              <div className="muc-row"><span>{item.ten}</span><span className="muc-num">{Math.min(item.giaTri, item.mucTieu)}/{item.mucTieu}</span></div>
              <div className="meter is-progress" aria-hidden="true"><span style={{ '--v': item.mucTieu ? Math.min(1, item.giaTri / item.mucTieu) : 0 }} /></div>
            </div>)}
          </section>}
        </>}

        <section className="muc-sec" aria-label="Tra từ nhanh">
          <span className="muc-label">Tra từ nhanh</span>
          <WordCombobox id="muc-lookup" value={lookupDraft} onChange={setLookupDraft} onPick={option => { setLookupDraft(option.tu); setLookupTerm(option.tu); }} placeholder="Gõ từ tiếng Anh hoặc tiếng Việt…" />
          {lookupTerm && <MucLookupResult term={lookupTerm} onSave={user ? saveCard : undefined} />}
          {!lookupTerm && <p className="small muted">Mẹo: bôi đen từ tiếng Anh trên trang, {name} tra giúp ngay.</p>}
        </section>

        {!user && <section className="muc-sec">
          <p className="small">Tạo tài khoản để lưu từ thành thẻ và để {name} nhắc lịch ôn cho bạn.</p>
          <Link className="btn btn-primary" href="/dang-ky" onClick={() => setOpen(false)}>Tạo tài khoản miễn phí</Link>
        </section>}

        <div className="muc-foot">
          <button className="muc-hide" type="button" onClick={collapse}>Thu gọn {name}</button>
          <button className="muc-hide" type="button" onClick={() => { resetPosition(); setOpen(false); }}>Đưa về góc</button>
        </div>
      </div>
      <div ref={bubbleRef} className="muc-bubble" role="status" aria-live="polite">{bubble}</div>
      <button ref={toggleRef} className="muc-toggle" type="button" aria-label={todo ? `Mở bảng việc của ${name}, còn ${todo} việc` : `Mở bảng của ${name}`} aria-expanded={open} aria-controls="muc-panel" title="Bấm để mở · kéo để di chuyển" onClick={toggle}>
        <span className="muc-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        {todo > 0 && <span className="muc-dot" aria-hidden="true">{todo > 99 ? '99+' : todo}</span>}
      </button>
    </aside>

    {chip && !pop && <button type="button" className="muc-chip" style={{ top: chip.top, left: chip.left }} onMouseDown={event => event.preventDefault()} onClick={openPop}>
      <span aria-hidden="true">🦑</span><span>Tra “<span lang="en">{chip.term}</span>”</span>
    </button>}

    {pop && <div className="muc-pop" role="dialog" aria-label={`Nghĩa của ${pop.term}`} style={{ left: pop.left, width: pop.width, top: pop.top, bottom: pop.bottom }}>
      <div className="muc-pop-head"><span>🦑 {name} tra giúp</span><button type="button" className="btn btn-quiet btn-icon btn-sm" aria-label="Đóng" onClick={() => setPop(null)}>×</button></div>
      <MucLookupResult term={pop.term} onSave={user ? saveCard : undefined} />
      {!user && <p className="small muted"><Link href="/dang-nhap">Đăng nhập</Link> để lưu từ thành thẻ.</p>}
    </div>}

    {card && <AddToDeckDialog key={cardKey} card={card} onClose={() => setCard(null)} />}
  </>;
}
