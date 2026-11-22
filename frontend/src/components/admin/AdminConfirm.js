'use client';
import { useCallback, useRef, useState } from 'react';
import { Modal } from '@/components/ui';
import { REASON_MAX, reasonError } from '@/lib/admin-ops.mjs';

function ConfirmBody({ request, onDone }) {
  const [lyDo, setLyDo] = useState('');
  const [touched, setTouched] = useState(false);
  const msg = request.reason ? reasonError(lyDo) : '';
  const submit = event => {
    event.preventDefault();
    setTouched(true);
    if (msg) return;
    onDone({ lyDo: lyDo.trim() });
  };
  return (
    <form onSubmit={submit} noValidate>
      {request.message && <p style={{ margin: '0 0 12px', color: 'var(--ink-2)', fontSize: 13.5 }}>{request.message}</p>}
      {request.items?.length > 0 && (
        <ul className="adm-confirm-list">
          {request.items.slice(0, 8).map(item => <li key={item}>{item}</li>)}
          {request.items.length > 8 && <li className="adm-muted">… và {request.items.length - 8} mục khác</li>}
        </ul>
      )}
      {request.reason && (
        <>
          <label className="adm-label" htmlFor="adm-confirm-reason">Lý do</label>
          <textarea id="adm-confirm-reason" className="adm-textarea" rows={3} autoFocus value={lyDo} onChange={event => setLyDo(event.target.value)} aria-invalid={touched && !!msg} aria-describedby="adm-confirm-hint" placeholder={request.placeholder || 'Lý do được ghi vào nhật ký quản trị.'} />
          <p id="adm-confirm-hint" className={touched && msg ? 'adm-error' : 'adm-hint'}>{touched && msg ? msg : `${lyDo.trim().length}/${REASON_MAX} ký tự · ghi vào nhật ký quản trị.`}</p>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" className="adm-btn" onClick={() => onDone(null)}>Hủy</button>
        <button type="submit" className={`adm-btn ${request.tone === 'danger' ? 'adm-btn-danger' : 'adm-btn-primary'}`} autoFocus={!request.reason}>{request.confirmLabel || 'Xác nhận'}</button>
      </div>
    </form>
  );
}

export function useAdminConfirm() {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(options => new Promise(resolve => {
    resolver.current = resolve;
    setRequest({ ...options, key: Date.now() });
  }), []);

  const done = value => {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  };

  const dialog = (
    <Modal isOpen={!!request} onClose={() => done(null)} title={request?.title || ''} className="adm-confirm">
      {request && <ConfirmBody key={request.key} request={request} onDone={done} />}
    </Modal>
  );

  return { confirm, dialog };
}
