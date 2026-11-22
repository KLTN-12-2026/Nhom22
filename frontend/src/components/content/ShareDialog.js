'use client';
import { useId, useState } from 'react';
import { Icon, Modal } from '@/components/ui';
import { SHARE_TARGETS } from '@/lib/share.mjs';
import styles from './ShareReport.module.css';

const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function ShareDialog({ onClose, title, kicker, heading, sub, detail, text, url }) {
  const linkId = useId();
  const [canNative] = useState(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  const [mobile] = useState(isMobile);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const targets = SHARE_TARGETS.filter(target => !target.mobile || mobile);
  const native = async () => {
    try { await navigator.share({ title: heading, text, url }); onClose(); }
    catch (error) { if (error?.name !== 'AbortError') setMessage('Máy không mở được bảng chia sẻ. Chọn một ứng dụng bên dưới.'); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setMessage(''); }
    catch { setMessage('Không sao chép được. Hãy chọn liên kết và sao chép thủ công.'); }
  };
  return (
    <Modal isOpen onClose={onClose} title={title} className={styles.dialog}>
      <figure className={styles.slip}>
        {kicker && <figcaption className={styles.kicker}>{kicker}</figcaption>}
        <p className={styles.slipWord} lang={sub !== undefined ? 'en' : undefined}>{heading}{sub && <span className={styles.slipSub}>{sub}</span>}</p>
        {detail && <p className={styles.slipDetail}>{detail}</p>}
        <span className={styles.slipBrand} aria-hidden="true">VocabLearning</span>
      </figure>

      {canNative && (
        <button type="button" className={`btn btn-primary ${styles.native}`} onClick={native}>
          <Icon name="share" />Chia sẻ qua ứng dụng trên máy
        </button>
      )}

      <p className={styles.section}>Gửi qua</p>
      <ul className={styles.targets}>
        {targets.map(target => (
          <li key={target.key}>
            <a className={styles.target} href={target.url({ url, text, title: heading })} target={target.key === 'email' || target.mobile ? undefined : '_blank'} rel="noopener noreferrer">
              <span className={styles.mark} style={{ '--mark': target.tone }} aria-hidden="true">{target.icon ? <Icon name={target.icon} /> : target.mark}</span>
              <span className={styles.targetText}><b>{target.label}</b><small>{target.hint}</small></span>
            </a>
          </li>
        ))}
      </ul>

      <label className={styles.section} htmlFor={linkId}>Liên kết</label>
      <div className={styles.link}>
        <input id={linkId} className={styles.linkInput} value={url} readOnly onFocus={event => event.target.select()} />
        <button type="button" className={`btn btn-secondary btn-sm ${styles.linkBtn}`} onClick={copy} aria-live="polite">
          <Icon name={copied ? 'check' : 'copy'} />{copied ? 'Đã sao chép' : 'Sao chép'}
        </button>
      </div>
      {message && <p className={styles.error} role="status">{message}</p>}
    </Modal>
  );
}
