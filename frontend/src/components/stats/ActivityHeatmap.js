'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ACTIVITY_METRICS, DEFAULT_METRIC, buildWeeks, levelOf, metricOf, monthLabels, summarize, thresholds } from '@/lib/activity-heatmap.mjs';
import styles from './ActivityHeatmap.module.css';

const STORAGE_KEY = 'vl-activity-metric';
const ROW_LABELS = ['T2', '', 'T4', '', 'T6', '', ''];
const number = value => value.toLocaleString('vi-VN');
const fullDay = value => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

function readMetric() {
  try {
    return metricOf(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_METRIC).key;
  } catch {
    return DEFAULT_METRIC;
  }
}

const OWN = { url: '/api/v1/statistics/activity', queryKey: ['stats-activity'], metrics: null };

export function ActivityHeatmap({ source = OWN, title = 'Hoạt động trong năm' }) {
  const allowed = source.metrics ? ACTIVITY_METRICS.filter(m => source.metrics.includes(m.key)) : ACTIVITY_METRICS;
  const [metricKey, setMetricKey] = useState(() => {
    const saved = readMetric();
    return allowed.some(m => m.key === saved) ? saved : allowed[0].key;
  });
  const [tip, setTip] = useState(null);
  const scrollRef = useRef(null);
  const wrapRef = useRef(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: source.queryKey,
    queryFn: () => apiFetch(source.url),
    staleTime: 5 * 60 * 1000,
  });

  const metric = metricOf(metricKey);
  const hidden = data?.congKhai === false;
  const days = hidden ? null : data?.theoNgay;
  const weeks = useMemo(() => buildWeeks(days), [days]);
  const months = useMemo(() => monthLabels(weeks), [weeks]);
  const limits = useMemo(() => thresholds((days || []).map(d => d[metric.key] || 0)), [days, metric.key]);
  const summary = useMemo(() => summarize(days, metric.key), [days, metric.key]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks.length]);

  const choose = key => {
    setMetricKey(key);
    try { window.localStorage.setItem(STORAGE_KEY, key); } catch {}
  };

  const showTip = (event, day) => {
    const box = wrapRef.current?.getBoundingClientRect();
    const cell = event.currentTarget.getBoundingClientRect();
    if (!box) return;
    const x = cell.left - box.left + cell.width / 2;
    setTip({ day, x: Math.min(Math.max(x, 110), box.width - 110), y: cell.top - box.top });
  };

  return (
    <section className={styles.card} style={{ '--hue': metric.hue }} aria-labelledby="activity-title">
      <header className={styles.head}>
        <div>
          <h2 id="activity-title" className={styles.title}>
            {isLoading || !days ? title : <><b>{number(summary.total)}</b> {metric.unit} trong năm qua</>}
          </h2>
          {days && (
            <p className={styles.meta}>
              <span>{summary.active} ngày có hoạt động</span>
              <span>Chuỗi dài nhất <b>{summary.longest}</b> ngày</span>
              <span>Chuỗi hiện tại <b>{summary.current}</b> ngày</span>
            </p>
          )}
        </div>
        <div className={styles.metrics} role="radiogroup" aria-label="Chỉ số hiển thị">
          {!hidden && allowed.length > 1 && allowed.map(m => (
            <button key={m.key} type="button" role="radio" aria-checked={m.key === metric.key} className={styles.metric} style={{ '--hue': m.hue }} onClick={() => choose(m.key)}>
              <span className={styles.dot} aria-hidden="true" />{m.label}
            </button>
          ))}
        </div>
      </header>

      {hidden ? (
        <p className={styles.state}>Người dùng này đã ẩn hoạt động học.</p>
      ) : error ? (
        <p className={styles.state}>Không tải được lịch hoạt động. <button type="button" className="btn btn-quiet" onClick={() => refetch()}>Thử lại</button></p>
      ) : isLoading || !days ? (
        <div className={`${styles.skeleton} sk`} aria-hidden="true" />
      ) : (
        <div className={styles.wrap} ref={wrapRef} onMouseLeave={() => setTip(null)}>
          <div className={styles.scroll} ref={scrollRef}>
            <div className={styles.grid} style={{ '--weeks': weeks.length }} role="img" aria-label={`${number(summary.total)} ${metric.unit} trong ${days.length} ngày, ${summary.active} ngày có hoạt động`}>
              {months.map(m => <span key={`${m.index}-${m.text}`} className={styles.month} style={{ gridColumn: m.index + 2 }} aria-hidden="true">{m.text}</span>)}
              {ROW_LABELS.map((label, i) => label && <span key={label} className={styles.row} style={{ gridRow: i + 2 }} aria-hidden="true">{label}</span>)}
              {weeks.map((week, w) => week.map((day, r) => day && (
                <span
                  key={day.ngay}
                  className={styles.cell}
                  data-level={levelOf(day[metric.key], limits)}
                  data-today={day.ngay === data.denNgay || undefined}
                  style={{ gridColumn: w + 2, gridRow: r + 2 }}
                  onMouseEnter={event => showTip(event, day)}
                />
              )))}
            </div>
          </div>
          {tip && (
            <div className={styles.tip} style={{ left: tip.x, top: tip.y }} role="status">
              <b>{tip.day[metric.key] ? `${number(tip.day[metric.key])} ${metric.unit}` : `Không có ${metric.unit}`}</b>
              <span>{fullDay(tip.day.ngay)}</span>
            </div>
          )}
          <footer className={styles.foot}>
            <span>Ngày tính theo múi giờ {data.muiGio}</span>
            <span className={styles.legend} aria-hidden="true">
              Ít {[0, 1, 2, 3, 4].map(level => <span key={level} className={styles.cell} data-level={level} />)} Nhiều
            </span>
          </footer>
        </div>
      )}
    </section>
  );
}
