'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon, Modal } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import {
  SNAP_FORMATS, SNAP_THEMES, canvasToBlob, loadImage, loadRemoteImage, loadSnapFonts, renderCardSnapshot, snapFileName,
} from '@/lib/card-snapshot';
import styles from './SnapDialog.module.css';

const canShareFiles = () => {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] }); }
  catch { return false; }
};

export function SnapDialog({ onClose, card, deckId, deckName, publicDeck = false, linkable = publicDeck, number = null }) {
  const canvas = useRef(null);
  const assets = useRef({ mascot: undefined, image: undefined });
  const [format, setFormat] = useState('portrait');
  const [theme, setTheme] = useState('giay');
  const [withImage, setWithImage] = useState(true);
  const [withLink, setWithLink] = useState(linkable);
  const [hasImage, setHasImage] = useState(false);
  const [preview, setPreview] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [shareFiles] = useState(canShareFiles);
  const [copyImage] = useState(() => typeof window !== 'undefined' && 'ClipboardItem' in window && !!navigator.clipboard?.write);

  useEffect(() => {
    let alive = true;
    let url = null;
    (async () => {
      await loadSnapFonts();
      if (alive) setRendering(true);
      if (assets.current.mascot === undefined) assets.current.mascot = await loadImage('/shared/assets/mascot-mark.svg').catch(() => null);
      if (assets.current.image === undefined) {
        assets.current.image = null;
        if (card.anhId) {
          try {
            const file = await apiFetch(`/api/v1/${publicDeck ? 'library/' : ''}decks/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(card.id)}/files/ANH`);
            assets.current.image = await loadRemoteImage(file?.downloadUrl);
          } catch {}
        }
        if (alive) setHasImage(!!assets.current.image);
      }
      if (!alive) return;
      const link = withLink && linkable ? `${window.location.host}/thu-vien/${deckId}` : '';
      await renderCardSnapshot(canvas.current, card, {
        format, theme, deckName, link, number,
        image: withImage ? assets.current.image : null,
        mascot: assets.current.mascot,
      });
      const blob = await canvasToBlob(canvas.current);
      if (!alive) return;
      url = URL.createObjectURL(blob);
      setPreview(url);
      setRendering(false);
    })().catch(() => { if (alive) { setRendering(false); setMessage('Không tạo được ảnh. Thử đổi khổ ảnh hoặc tải lại trang.'); } });
    return () => { alive = false; if (url) setTimeout(() => URL.revokeObjectURL(url), 1000); };
  }, [card, deckId, deckName, publicDeck, linkable, number, format, theme, withImage, withLink]);

  const currentBlob = () => canvasToBlob(canvas.current);
  const fileName = snapFileName(card);

  const save = async () => {
    setBusy('save'); setMessage('');
    try {
      const blob = await currentBlob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setMessage('Đã lưu ảnh vào thư mục tải xuống.');
    } catch { setMessage('Không lưu được ảnh. Thử lại.'); }
    finally { setBusy(''); }
  };

  const share = async () => {
    setBusy('share'); setMessage('');
    try {
      const blob = await currentBlob();
      const file = new File([blob], fileName, { type: 'image/png' });
      await navigator.share({ files: [file], title: card.tu, text: `${card.tu}: ${card.nghiaVi}` });
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('Máy không chia sẻ được ảnh. Hãy lưu ảnh rồi gửi.');
    } finally { setBusy(''); }
  };

  const copy = async () => {
    setBusy('copy'); setMessage('');
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': currentBlob() })]);
      setMessage('Đã sao chép ảnh. Dán vào tin nhắn hoặc bài đăng.');
    } catch { setMessage('Không sao chép được ảnh. Hãy lưu ảnh rồi gửi.'); }
    finally { setBusy(''); }
  };

  const selected = SNAP_FORMATS.find(item => item.key === format);
  const footer = <>
    {copyImage && <button type="button" className="btn btn-secondary" onClick={copy} disabled={rendering || !!busy}><Icon name="copy" />{busy === 'copy' ? 'Đang sao chép…' : 'Sao chép ảnh'}</button>}
    {shareFiles && <button type="button" className="btn btn-secondary" onClick={share} disabled={rendering || !!busy}><Icon name="share" />Chia sẻ ảnh</button>}
    <button type="button" className="btn btn-primary" onClick={save} disabled={rendering || !!busy} aria-busy={busy === 'save'}><Icon name="download" />{busy === 'save' ? 'Đang lưu…' : 'Lưu ảnh'}</button>
  </>;

  return (
    <Modal isOpen onClose={onClose} title="Chụp thẻ" footer={footer} className={styles.dialog}>
      <div className={styles.layout}>
        <div className={styles.stage} style={{ '--ratio': `${selected.width} / ${selected.height}` }}>
          <div className={styles.frame} aria-busy={rendering}>
            {preview && <img className={styles.image} src={preview} alt={`Ảnh thẻ ${card.tu}`} width={selected.width} height={selected.height} />}
            {rendering && <span className={styles.loading} role="status"><span className={styles.spinner} aria-hidden="true" />Đang vẽ ảnh…</span>}
          </div>
        </div>

        <div className={styles.controls}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>Khổ ảnh</legend>
            <div className={styles.formats}>
              {SNAP_FORMATS.map(item => (
                <label key={item.key} className={styles.format}>
                  <input type="radio" name="snap-format" value={item.key} checked={format === item.key} onChange={() => setFormat(item.key)} />
                  <span className={styles.formatShape} style={{ '--w': item.width, '--h': item.height }} aria-hidden="true" />
                  <span className={styles.formatText}><b>{item.label}</b><small>{item.hint}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Màu nền</legend>
            <div className={styles.themes}>
              {SNAP_THEMES.map(item => (
                <label key={item.key} className={styles.theme}>
                  <input type="radio" name="snap-theme" value={item.key} checked={theme === item.key} onChange={() => setTheme(item.key)} />
                  <span className={styles.swatch} style={{ '--desk': item.desk, '--sheet': item.sheet, '--accent': item.primary }} aria-hidden="true"><i /></span>
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {(hasImage || linkable) && (
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Kèm theo</legend>
              {hasImage && <label className={styles.toggle}><input type="checkbox" checked={withImage} onChange={event => setWithImage(event.target.checked)} /><span>Ảnh minh họa</span></label>}
              {linkable && <label className={styles.toggle}><input type="checkbox" checked={withLink} onChange={event => setWithLink(event.target.checked)} /><span>Liên kết tới bộ thẻ</span></label>}
            </fieldset>
          )}

          {message && <p className={styles.message} role="status">{message}</p>}
        </div>
      </div>
      <canvas ref={canvas} hidden />
    </Modal>
  );
}
