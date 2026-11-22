'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { BADGE_CONDITIONS, newMotivation, motivationPayload, motivationErrors, motivationCondition } from '@/lib/engagement-admin.mjs';
import { Button, EmptyState, ErrorState, Icon, Input, Modal, Pagination, Select, Textarea } from '@/components/ui';
import styles from './page.module.css';

const KINDS = [{ id: 'badges', label: 'Huy hiệu', icon: 'shield' }, { id: 'challenges', label: 'Thử thách', icon: 'target' }];
const adminKey = ['admin', 'engagement'];
const isConflict = error => error?.code === 'VERSION_CONFLICT';

export default function MotivationAdminPage() {
  const client = useQueryClient();
  const [kind, setKind] = useState('badges');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(newMotivation('badges'));
  const [fields, setFields] = useState({});
  const [toggling, setToggling] = useState(null);
  const [message, setMessage] = useState('');
  const isBadge = kind === 'badges';
  const noun = isBadge ? 'huy hiệu' : 'thử thách';
  const query = useQuery({
    queryKey: [...adminKey, kind, page],
    queryFn: () => apiFetch(`/api/v1/admin/${kind}?page=${page - 1}&size=20`),
  });
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: adminKey }),
    client.invalidateQueries({ queryKey: ['badges'] }),
    client.invalidateQueries({ queryKey: ['challenges'] }),
    client.invalidateQueries({ queryKey: ['admin-audit'] }),
  ]);
  const save = useMutation({
    mutationFn: ({ item, body }) => apiFetch(`/api/v1/admin/${kind}${item ? `/${encodeURIComponent(item.id)}` : ''}`, {
      method: item ? 'PUT' : 'POST', body: JSON.stringify(body),
    }),
    onSuccess: (_, variables) => {
      setEditor(null);
      setMessage(`Đã ${variables.item ? 'cập nhật' : 'tạo'} ${noun} “${variables.body.ten}”.`);
      refresh();
    },
    onError: error => {
      setFields(Object.fromEntries((error.fieldErrors || []).map(field => [field.field, field.message])));
    },
  });
  const toggle = useMutation({
    mutationFn: item => apiFetch(`/api/v1/admin/${kind}/${encodeURIComponent(item.id)}`, {
      method: 'PUT', body: JSON.stringify(motivationPayload(kind, { ...item, hoatDong: !item.hoatDong }, item)),
    }),
    onSuccess: (_, item) => {
      setToggling(null);
      setMessage(`Đã ${item.hoatDong ? 'tắt' : 'bật'} ${noun} “${item.ten}”.`);
      refresh();
    },
  });

  function changeKind(next) {
    setKind(next); setPage(1); setMessage(''); save.reset(); toggle.reset();
  }
  function openEditor(item = null) {
    setDraft(item ? { ...item } : newMotivation(kind));
    setFields({}); save.reset(); setEditor({ item });
  }
  function submit(event) {
    event.preventDefault();
    const errors = motivationErrors(kind, draft);
    setFields(errors);
    if (Object.keys(errors).length) {
      event.currentTarget.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    save.mutate({ item: editor.item, body: motivationPayload(kind, draft, editor.item) });
  }
  function reload() {
    setEditor(null); setToggling(null); save.reset(); toggle.reset(); refresh();
  }
  function editField(event) {
    const { name, value, type, checked } = event.target;
    setDraft(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setFields(previous => ({ ...previous, [name]: undefined }));
  }
  const control = name => ({ id: name, name, value: draft[name], onChange: editField, error: fields[name] });

  return (
    <div className={`page ${styles.page}`}>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/quan-tri">Quản trị</Link><span aria-hidden="true">/</span><span aria-current="page">Huy hiệu và thử thách</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Quản trị</span><span>Điều kiện ghi nhận</span></div>
          <h1 id="page-title">Huy hiệu và thử thách</h1>
          <p>Quản lý điều kiện ghi nhận, không thay đổi điểm tùy ý.</p>
        </div>
        <div className={styles.toolbar}>
          <div className={`tabs ${styles.tabs}`} role="tablist" aria-label="Danh mục động lực">
            {KINDS.map((tab, index) => (
              <button key={tab.id} type="button" className="tab" role="tab" id={`tab-${tab.id}`}
                aria-selected={kind === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={kind === tab.id ? 0 : -1}
                onClick={() => changeKind(tab.id)} onKeyDown={event => {
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : ['ArrowLeft', 'ArrowRight'].includes(event.key) ? 1 - index : null;
                  if (next !== null) { event.preventDefault(); changeKind(KINDS[next].id); document.getElementById(`tab-${KINDS[next].id}`).focus(); }
                }}><Icon name={tab.icon} />{tab.label}</button>
            ))}
          </div>
          <Button onClick={() => openEditor()}><Icon name="plus" />Tạo {noun}</Button>
        </div>
        {message && <p className="notice notice-success" role="status">{message}</p>}
        {KINDS.map(tab => (
          <section key={tab.id} id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={kind !== tab.id} tabIndex={0} className={styles.panel}>
            {kind === tab.id && <>
              {query.isPending ? <div className="skeleton" role="status" aria-label="Đang tải danh mục"><div className="sk sk-row" /><div className="sk sk-row" /><div className="sk sk-row" /></div>
                : query.isError ? <ErrorState title={`Chưa tải được ${noun}`} description={query.error.message} onRetry={query.refetch} />
                : !query.data?.items.length ? <EmptyState icon={<Icon name={tab.icon} />} title={`Chưa có ${noun}`} description={`Tạo ${noun} đầu tiên để ghi nhận việc học của người dùng.`} action={{ label: `Tạo ${noun}`, onClick: () => openEditor() }} />
                : <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <caption>{query.data.totalElements.toLocaleString('vi-VN')} {noun} · Bao gồm mục đang dùng và đã tắt</caption>
                    <thead><tr><th scope="col">Tên</th><th scope="col">Điều kiện</th><th scope="col">Trạng thái</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead>
                    <tbody>{query.data.items.map(item => (
                      <tr key={item.id}>
                        <td data-label="Tên"><div className={styles.itemName}><span className={styles.itemIcon}><Icon name={tab.icon} /></span><div><strong>{item.ten}</strong><span className={styles.code}>{item.ma}</span><p>{item.moTa}</p></div></div></td>
                        <td data-label="Điều kiện"><span>{motivationCondition(kind, item)}</span>{!isBadge && <small className={styles.hint}>Thứ Hai – Chủ nhật</small>}</td>
                        <td data-label="Trạng thái"><span className={`stamp ${item.hoatDong ? 'stamp-success' : 'stamp-quiet'}`}><Icon name={item.hoatDong ? 'check' : 'pause'} />{item.hoatDong ? 'Đang dùng' : 'Đã tắt'}</span></td>
                        <td data-label="Thao tác"><div className={styles.actions}><Button variant="edit" onClick={() => openEditor(item)} aria-label={`Sửa ${item.ten}`}><Icon name="edit" />Sửa</Button><Button variant="secondary" onClick={() => { toggle.reset(); setToggling(item); }} aria-label={`${item.hoatDong ? 'Tắt' : 'Bật'} ${item.ten}`}><Icon name={item.hoatDong ? 'pause' : 'play'} />{item.hoatDong ? 'Tắt' : 'Bật'}</Button></div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>}
              <Pagination page={page} totalPages={query.data?.totalPages || 0} onPageChange={setPage} />
            </>}
          </section>
        ))}
        <p className={styles.note}><Icon name="info" /><span>Điều kiện được hệ thống kiểm tra từ hoạt động học hợp lệ. Bật hoặc tắt danh mục không thay đổi điểm và huy hiệu đã ghi nhận.</span></p>
      </article>

      <Modal isOpen={!!editor} onClose={() => setEditor(null)} title={`${editor?.item ? 'Sửa' : 'Tạo'} ${noun}`} loading={save.isPending}
        footer={<><Button variant="secondary" disabled={save.isPending} onClick={() => setEditor(null)}>Hủy</Button>{isConflict(save.error) ? <Button onClick={reload}><Icon name="refresh" />Tải lại danh mục</Button> : <Button type="submit" form="motivation-form" loading={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>}</>}>
        {editor && <form id="motivation-form" className={styles.form} onSubmit={submit} noValidate>
          <p className={styles.formIntro}>{isBadge ? 'Huy hiệu được trao khi người học đạt điều kiện. Không cộng thêm điểm thưởng.' : 'Thử thách lặp lại hằng tuần, từ thứ Hai đến Chủ nhật. Chỉ tính lượt ôn hợp lệ.'}</p>
          {save.isError && <p className="notice notice-danger" role="alert">{isConflict(save.error) ? 'Danh mục vừa được người khác cập nhật. Tải lại dữ liệu trước khi sửa tiếp.' : save.error.message}</p>}
          <fieldset className={styles.fields} disabled={save.isPending || isConflict(save.error)}>
            <Input {...control('ma')} label="Mã danh mục" required maxLength={30} readOnly={!!editor.item} autoComplete="off" hint={editor.item ? 'Mã không đổi sau khi tạo.' : 'Chữ hoa, số và dấu gạch dưới, ví dụ: CHUOI_7.'} />
            <Input {...control('ten')} label="Tên" required maxLength={100} autoComplete="off" />
            <Textarea {...control('moTa')} label="Mô tả điều kiện đạt" required maxLength={255} rows={3} />
            {isBadge ? <>
              <Select {...control('loaiDieuKien')} label="Loại điều kiện" required options={Object.entries(BADGE_CONDITIONS).map(([value, label]) => ({ value, label }))} />
              <div className={styles.formGrid}><Input {...control('nguong')} label="Ngưỡng đạt" required type="number" min={1} max={2147483647} step={1} /><Input {...control('thuTu')} label="Thứ tự hiển thị" required type="number" min={0} max={2147483647} step={1} /></div>
            </> : <>
              <div className={styles.rule}><Icon name="calendar" /><div><strong>Lượt ôn hợp lệ · Hằng tuần</strong><p>Thứ Hai – Chủ nhật, theo múi giờ của người học.</p></div></div>
              <Input {...control('mucTieu')} label="Mục tiêu lượt ôn" required type="number" min={1} max={2147483647} step={1} hint={editor.item ? 'Không thể đổi mục tiêu nếu thử thách đã có tiến độ. Bạn vẫn có thể sửa mô tả hoặc bật/tắt.' : 'Số lượt ôn hợp lệ cần đạt trong một tuần.'} />
            </>}
            <label className={styles.activeChoice}><input type="checkbox" name="hoatDong" checked={draft.hoatDong} onChange={editField} /><span><strong>Đang dùng</strong><small>Cho phép hệ thống xét điều kiện của danh mục này.</small></span></label>
          </fieldset>
          <div className={styles.preview}><span className={styles.hint}>Điều kiện ghi nhận</span><strong>{motivationCondition(kind, motivationPayload(kind, draft, editor.item))}</strong></div>
        </form>}
      </Modal>

      <Modal isOpen={!!toggling} onClose={() => setToggling(null)} title={`${toggling?.hoatDong ? 'Tắt' : 'Bật'} ${noun}?`} loading={toggle.isPending} role="alertdialog"
        footer={<><Button variant="secondary" disabled={toggle.isPending} onClick={() => setToggling(null)}>Hủy</Button>{isConflict(toggle.error) ? <Button onClick={reload}>Tải lại danh mục</Button> : <Button onClick={() => toggle.mutate(toggling)} loading={toggle.isPending}>{toggle.isPending ? 'Đang lưu…' : `Xác nhận ${toggling?.hoatDong ? 'tắt' : 'bật'}`}</Button>}</>}>
        <p><strong>{toggling?.ten}</strong></p>
        <p>{toggling?.hoatDong ? 'Hệ thống sẽ ngừng xét điều kiện của mục này. Điểm, huy hiệu đã nhận và tiến độ đã ghi vẫn được giữ nguyên.' : 'Hệ thống sẽ tiếp tục xét điều kiện của mục này từ hoạt động học hợp lệ.'}</p>
        {toggle.isError && <p className="notice notice-danger" role="alert">{isConflict(toggle.error) ? 'Danh mục vừa được cập nhật. Tải lại trước khi xác nhận.' : toggle.error.message}</p>}
      </Modal>
    </div>
  );
}
