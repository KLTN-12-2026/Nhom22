'use client';
import { useEffect, useId, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  GMT_OPTIONS, deviceZone, describeZone, gmtHoursOf, isFixedGmt, localClock, localTime, searchZones
} from '@/lib/time-zones.mjs';
import styles from './TimeZonePicker.module.css';

const MODES = [
  ['city', 'Thành phố / quốc gia', 'globe'],
  ['gmt', 'Chọn theo GMT', 'clock'],
  ['device', 'Giờ của máy', 'today']
];

export function TimeZonePicker({ value, onChange, id, label = 'Múi giờ' }) {
  const auto = useId();
  const base = id || auto;
  const [device, setDevice] = useState('');
  const [mode, setMode] = useState(() => (isFixedGmt(value) ? 'gmt' : 'city'));
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setTimeout(() => setDevice(deviceZone()), 0);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => { clearTimeout(t); clearInterval(timer); };
  }, []);

  const results = useMemo(() => (mode === 'city' ? searchZones(query) : []), [mode, query]);
  const pick = zone => { onChange(zone); setQuery(''); };
  const gmtHours = gmtHoursOf(value);

  const onKey = e => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[active].zone); }
  };

  return (
    <div className={styles.picker} role="group" aria-labelledby={`${base}-label`}>
      <div className={styles.head}>
        <span className="field-label" id={`${base}-label`}>{label}</span>
        <span className={styles.current}>
          <Icon name="globe" /><strong>{describeZone(value, now)}</strong>
          <span className="muted">· {localTime(value, now)}</span>
        </span>
      </div>

      <div className={styles.modes} role="tablist" aria-label="Cách chọn múi giờ">
        {MODES.map(([m, text, icon]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={styles.mode} onClick={() => setMode(m)}>
            <Icon name={icon} />{text}
          </button>
        ))}
      </div>

      {mode === 'city' && (
        <div className={styles.panel}>
          <div className="input-with-icon">
            <Icon name="search" />
            <input
              className="input"
              id={base}
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${base}-list`}
              aria-activedescendant={results[active] ? `${base}-opt-${active}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              placeholder="Gõ thành phố, quốc gia hoặc GMT+7…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKey}
            />
          </div>
          <p className={styles.hint}>{query ? `${results.length} kết quả` : 'Gợi ý phổ biến. Gõ để tìm trong hơn 400 múi giờ trên thế giới.'}</p>
          <ul className={styles.list} id={`${base}-list`} role="listbox" aria-label="Kết quả múi giờ">
            {results.map((z, i) => (
              <li
                key={z.zone}
                id={`${base}-opt-${i}`}
                role="option"
                aria-selected={z.zone === value}
                className={`${styles.option}${i === active ? ` ${styles.active}` : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(z.zone)}
              >
                <span className={styles.flag} aria-hidden="true">{z.code}</span>
                <span className={styles.optMain}>
                  <strong>{z.city}</strong>
                  <span>{z.country}</span>
                </span>
                <span className={styles.optSide}>
                  <span className={styles.offset}>{z.offsetLabel}</span>
                  <span className={styles.time}>{localClock(z.zone, now)}</span>
                </span>
                {z.zone === value && <Icon name="check" />}
              </li>
            ))}
            {!results.length && <li className={styles.none}>Không tìm thấy. Thử tên tiếng Anh (vd. “Sydney”) hoặc chọn theo GMT.</li>}
          </ul>
          <p className={styles.note}><Icon name="info" />Chọn theo thành phố thì giờ mùa hè (DST) được tự điều chỉnh.</p>
        </div>
      )}

      {mode === 'gmt' && (
        <div className={styles.panel}>
          <label className="field-label" htmlFor={`${base}-gmt`}>Độ lệch so với giờ GMT</label>
          <select className="select" id={`${base}-gmt`} value={gmtHours === null ? '' : String(gmtHours)} onChange={e => e.target.value !== '' && onChange(GMT_OPTIONS.find(o => String(o.hours) === e.target.value).id)}>
            {gmtHours === null && <option value="">Chọn độ lệch GMT…</option>}
            {GMT_OPTIONS.map(o => <option key={o.id} value={o.hours}>{o.label}{o.hours === 7 ? ' (Việt Nam)' : ''}</option>)}
          </select>
          <div className={styles.gmtScale} aria-hidden="true">
            {GMT_OPTIONS.map(o => (
              <button key={o.id} type="button" tabIndex={-1} className={o.hours === gmtHours ? styles.on : undefined} onClick={() => onChange(o.id)} title={o.label}>
                {o.hours > 0 ? `+${o.hours}` : o.hours === 0 ? '0' : o.hours}
              </button>
            ))}
          </div>
          <p className={styles.note}><Icon name="alert" />Múi giờ GMT cố định không tự đổi theo giờ mùa hè. Nơi có giờ mùa hè hoặc lệch nửa giờ (vd. Ấn Độ GMT+5:30) nên chọn theo thành phố.</p>
        </div>
      )}

      {mode === 'device' && (
        <div className={styles.panel}>
          <div className={styles.device}>
            <Icon name="today" />
            <div>
              <strong>{device ? describeZone(device, now) : 'Đang đọc múi giờ của máy…'}</strong>
              <p className="small muted">{device ? `${device} · bây giờ ${localTime(device, now)}` : ''}</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" disabled={!device || device === value} onClick={() => onChange(device)}>
              {device && device === value ? 'Đang dùng' : 'Dùng múi giờ này'}
            </button>
          </div>
          <p className={styles.note}><Icon name="info" />Lấy từ cài đặt của trình duyệt trên thiết bị này. Khi đi nơi khác, mở lại mục này để cập nhật.</p>
        </div>
      )}
    </div>
  );
}
