'use client';
import { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icon, Modal } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { REPORT_NOTE_MAX, reportNoteError, reportReasons, sendReport } from '@/lib/share.mjs';
import styles from './ShareReport.module.css';

const TARGET_LABEL = { BO_THE: 'bộ thẻ', THE_TU_VUNG: 'thẻ', NGUOI_DUNG: 'người dùng' };
const KICKER = { BO_THE: 'Bộ thẻ bị báo cáo', THE_TU_VUNG: 'Thẻ bị báo cáo', NGUOI_DUNG: 'Người dùng bị báo cáo' };
const LETTERS = 'ABCDEF';

export function ReportDialog({ onClose, loaiDoiTuong, doiTuongId, name }) {
  const baseId = useId();
  const noteId = `${baseId}-note`;
  const formId = `${baseId}-form`;
  const [lyDo, setLyDo] = useState('');
  const [moTa, setMoTa] = useState('');
  const [touched, setTouched] = useState(false);
  const mutation = useMutation({ mutationFn: () => sendReport(apiFetch, { loaiDoiTuong, doiTuongId, lyDo, moTa }), retry: false });
  const noteError = reportNoteError(lyDo, moTa);
  const serverNote = mutation.error?.fieldErrors?.find(field => field.field === 'moTa')?.message;
  const target = TARGET_LABEL[loaiDoiTuong] || 'nội dung';
  const other = lyDo === 'KHAC';
  const noteMessage = touched && (noteError || serverNote);
  const length = moTa.trim().length;
  const submit = event => {
    event.preventDefault();
    setTouched(true);
    if (!lyDo || noteError) return;
    mutation.mutate();
  };
  const failure = mutation.error && !serverNote && (mutation.error.status === 409
    ? `Bạn đã báo cáo ${target} này. Báo cáo đang chờ quản trị viên xử lý.`
    : mutation.error.status === 401 ? 'Phiên đăng nhập đã hết. Đăng nhập lại rồi gửi báo cáo.'
    : mutation.error.status === 429 ? 'Bạn gửi quá nhiều báo cáo. Thử lại sau ít phút.'
    : mutation.error.message);
  const footer = mutation.isSuccess
    ? <button type="button" className="btn btn-primary" onClick={onClose}>Xong</button>
    : <>
      <span className={styles.footNote}>Chỉ quản trị viên xem được báo cáo.</span>
      <span className={styles.footActions}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={mutation.isPending}>Hủy</button>
        <button type="submit" form={formId} className="btn btn-danger" disabled={mutation.isPending} aria-busy={mutation.isPending}><Icon name="flag" />{mutation.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}</button>
      </span>
    </>;
  return (
    <Modal isOpen onClose={onClose} title={`Báo cáo ${target}`} loading={mutation.isPending} footer={footer} className={`${styles.dialog} ${styles.dialogWide}`}>
      {mutation.isSuccess ? (
        <div className={styles.done} role="status">
          <span className={styles.doneMark} aria-hidden="true"><Icon name="check" /></span>
          <p className={styles.doneTitle}>Đã gửi báo cáo</p>
          <p className={styles.doneText}>Cảm ơn bạn. Quản trị viên sẽ xem xét <b>“{name}”</b> {loaiDoiTuong === 'NGUOI_DUNG' ? 'và xử lý nếu vi phạm' : 'và ẩn nội dung nếu vi phạm'}. Bạn sẽ nhận thông báo khi có kết quả.</p>
        </div>
      ) : (
        <form id={formId} onSubmit={submit} noValidate>
          <div className={styles.subject}>
            <span className={styles.kicker}>{KICKER[loaiDoiTuong] || 'Nội dung bị báo cáo'}</span>
            <p className={styles.subjectName} lang={loaiDoiTuong === 'THE_TU_VUNG' ? 'en' : undefined}>{name}</p>
          </div>

          <fieldset className={styles.reasons} aria-describedby={touched && !lyDo ? `${baseId}-reason-error` : undefined}>
            <legend className={styles.section}>Vấn đề bạn thấy là gì?</legend>
            <div className={styles.reasonGrid}>
              {reportReasons(loaiDoiTuong).map((reason, index) => (
                <label key={reason.value} className={styles.reason}>
                  <input type="radio" name={`${baseId}-lyDo`} value={reason.value} checked={lyDo === reason.value} onChange={() => setLyDo(reason.value)} />
                  <span className={styles.letter} aria-hidden="true">{LETTERS[index]}</span>
                  <span className={styles.reasonText}><b>{reason.title}</b><small>{reason.desc}</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          {touched && !lyDo && <p id={`${baseId}-reason-error`} className={styles.error} role="alert">Chọn một vấn đề trước khi gửi.</p>}

          <div className={`${styles.note}${other ? ` ${styles.noteRequired}` : ''}`}>
            <div className={styles.noteHead}>
              <label className={styles.section} htmlFor={noteId}>{other ? 'Mô tả vấn đề' : 'Mô tả thêm'}</label>
              <span className={styles.noteTag}>{other ? 'Bắt buộc' : 'Không bắt buộc'}</span>
            </div>
            <textarea id={noteId} className={styles.textarea} rows={3} maxLength={REPORT_NOTE_MAX + 50} value={moTa} onChange={event => setMoTa(event.target.value)} aria-invalid={!!noteMessage} aria-describedby={`${noteId}-hint`} placeholder={other ? (loaiDoiTuong === 'NGUOI_DUNG' ? 'Ví dụ: người này gửi tin nhắn xúc phạm trong phần mô tả bộ thẻ.' : 'Ví dụ: câu ví dụ dùng sai thì của động từ.') : 'Chỉ rõ chỗ sai để quản trị viên xử lý nhanh hơn.'} />
            <div id={`${noteId}-hint`} className={styles.noteFoot}>
              <span className={noteMessage ? styles.error : undefined}>{noteMessage || (other ? 'Ít nhất 10 ký tự.' : '')}</span>
              <span className={`${styles.count}${length > REPORT_NOTE_MAX ? ` ${styles.error}` : ''}`}>{length}/{REPORT_NOTE_MAX}</span>
            </div>
          </div>

          {failure && <p className="notice notice-warning" role="alert"><Icon name="alert" />{failure}</p>}
        </form>
      )}
    </Modal>
  );
}
