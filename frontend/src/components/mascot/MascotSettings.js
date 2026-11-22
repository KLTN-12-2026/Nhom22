'use client';
import { useState } from 'react';
import { DEFAULT_NAME, readMucName, readMucSettings, saveMucName, saveMucSettings } from '@/lib/mascot.mjs';
import { Icon } from '@/components/ui';

export function MascotSettings() {
  const [name, setName] = useState(readMucName);
  const [settings, setSettings] = useState(readMucSettings);
  const [status, setStatus] = useState('');

  const submit = event => {
    event.preventDefault();
    try {
      const saved = saveMucName(name);
      setName(saved);
      setStatus(`Đã lưu. Bạn học của bạn giờ tên là ${saved}.`);
    } catch {
      setStatus('Trình duyệt đang chặn lưu thiết lập.');
    }
  };

  const toggle = (key, value) => {
    try {
      saveMucSettings({ [key]: value });
      setSettings(current => ({ ...current, [key]: value }));
      setStatus('');
    } catch {
      setStatus('Trình duyệt đang chặn lưu thiết lập.');
    }
  };

  return <section className="speech-settings muc-settings" aria-labelledby="muc-settings-title">
    <h2 id="muc-settings-title">Bạn học {name || DEFAULT_NAME}</h2>
    <p className="field-hint">Linh vật nhắc lịch ôn, báo thẻ đến hạn và tra từ giúp bạn. Thiết lập lưu trên trình duyệt này.</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <label className="field-label" htmlFor="muc-name">Tên bạn học</label>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input id="muc-name" className="input" maxLength={24} autoComplete="off" value={name} onChange={event => setName(event.target.value)} placeholder={DEFAULT_NAME} />
        <button type="submit" className="btn btn-edit muc-save">Lưu tên</button>
      </div>
    </form>
    <label className="choice">
      <input type="checkbox" checked={!settings.collapsed} onChange={event => toggle('collapsed', !event.target.checked)} />
      <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
      <span>Hiện {name || DEFAULT_NAME} cỡ lớn ở góc màn hình (tắt thì thu nhỏ)</span>
    </label>
    <label className="choice">
      <input type="checkbox" checked={settings.selectLookup} onChange={event => toggle('selectLookup', event.target.checked)} />
      <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
      <span>Bôi đen từ tiếng Anh thì hiện nút tra nghĩa</span>
    </label>
    <p className="field-hint" role="status">{status}</p>
  </section>;
}
