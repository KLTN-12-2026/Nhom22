'use client';
import { Fragment, useMemo, useState } from 'react';
import { ErrorState, Icon, Pagination, useToast } from '@/components/ui';
import { nextSort, rangeText, sortRows, toCsv } from '@/lib/admin-table.mjs';

function download(content, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"]';

export function AdminTable({
  columns,
  rows = [],
  rowKey = 'id',
  caption,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'Không có dữ liệu',
  emptyText = '',
  emptyAction = null,
  selectable = false,
  isSelectable,
  bulkActions,
  onRowClick,
  rowLabel,
  expand,
  toolbar,
  pagination,
  exportCsv,
  defaultSort = null,
}) {
  const { toast } = useToast();
  const [sort, setSort] = useState(defaultSort);
  const [selected, setSelected] = useState(() => new Set());
  const [open, setOpen] = useState(() => new Set());
  const [exporting, setExporting] = useState(false);
  const keyOf = row => String(typeof rowKey === 'function' ? rowKey(row) : row[rowKey]);
  const sortColumn = columns.find(column => column.key === sort?.key);
  const shown = useMemo(() => (sortColumn ? sortRows(rows, sortColumn, sort.direction) : rows), [rows, sortColumn, sort]);
  const pickable = shown.filter(row => !isSelectable || isSelectable(row));
  const selectedRows = shown.filter(row => selected.has(keyOf(row)));
  const allChecked = pickable.length > 0 && pickable.every(row => selected.has(keyOf(row)));
  const someChecked = selectedRows.length > 0 && !allChecked;
  const span = columns.length + (selectable ? 1 : 0) + (expand ? 1 : 0);

  const toggle = key => setSelected(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(pickable.map(keyOf)));
  const clear = () => setSelected(new Set());
  const toggleOpen = key => setOpen(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  async function runExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const data = exportCsv.fetchAll ? await exportCsv.fetchAll() : shown;
      download(toCsv(exportCsv.columns || columns, data), exportCsv.filename);
      toast(`Đã xuất ${data.length.toLocaleString('vi-VN')} dòng ra ${exportCsv.filename}.`, { variant: 'success' });
    } catch (err) {
      toast(err.message || 'Chưa xuất được CSV.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  }

  function rowClick(event, row) {
    if (!onRowClick || event.target.closest(INTERACTIVE)) return;
    onRowClick(row);
  }

  const hasToolbar = toolbar || exportCsv;

  return (
    <div className="adm-dt">
      {hasToolbar && (
        <div className="adm-toolbar adm-dt-toolbar">
          {toolbar}
          {exportCsv && (
            <button type="button" className="adm-btn adm-dt-export" onClick={runExport} disabled={exporting || loading || (!exportCsv.fetchAll && !rows.length)}>
              <Icon name="download" />{exporting ? 'Đang xuất…' : 'Xuất CSV'}
            </button>
          )}
        </div>
      )}
      {selectable && selectedRows.length > 0 && (
        <div className="adm-dt-bulk" role="region" aria-label="Thao tác hàng loạt">
          <b>{selectedRows.length} đã chọn</b>
          {bulkActions?.(selectedRows, clear)}
          <button type="button" className="adm-btn adm-btn-sm adm-dt-clear" onClick={clear}>Bỏ chọn</button>
        </div>
      )}
      {error ? (
        <ErrorState title="Chưa tải được dữ liệu" description={error.message} onRetry={onRetry} />
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-dt-table" aria-busy={loading || undefined}>
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                {selectable && (
                  <th scope="col" className="adm-dt-check">
                    <input type="checkbox" aria-label="Chọn tất cả dòng trong trang" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll} disabled={!pickable.length} />
                  </th>
                )}
                {expand && <th scope="col" className="adm-dt-check"><span className="sr-only">Mở chi tiết</span></th>}
                {columns.map(column => {
                  const active = sort?.key === column.key;
                  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined;
                  return (
                    <th key={column.key} scope="col" aria-sort={column.sortValue ? (ariaSort || 'none') : undefined} className={column.align === 'right' ? 'adm-num' : undefined} style={column.width ? { width: column.width } : undefined}>
                      {column.sortValue ? (
                        <button type="button" className="adm-dt-sort" data-active={active || undefined} onClick={() => setSort(current => nextSort(current, column.key))}>
                          {column.header}
                          <span aria-hidden="true">{active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                        </button>
                      ) : column.srHeader ? <span className="sr-only">{column.header}</span> : column.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`sk-${i}`} className="adm-dt-skeleton"><td colSpan={span}><span /></td></tr>
                ))
              ) : !shown.length ? (
                <tr><td colSpan={span}><div className="adm-empty"><b>{emptyTitle}</b>{emptyText}{emptyAction && <div style={{ marginTop: 12 }}>{emptyAction}</div>}</div></td></tr>
              ) : shown.map(row => {
                const key = keyOf(row);
                const detail = expand ? expand(row) : null;
                const isOpen = open.has(key);
                const checked = selected.has(key);
                return (
                  <Fragment key={key}>
                    <tr
                      className={[onRowClick ? 'adm-dt-clickable' : '', checked ? 'adm-dt-selected' : '', isOpen ? 'adm-dt-open' : ''].filter(Boolean).join(' ') || undefined}
                      onClick={event => rowClick(event, row)}
                      onKeyDown={onRowClick ? event => { if (event.key === 'Enter' && event.target === event.currentTarget) onRowClick(row); } : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                    >
                      {selectable && (
                        <td className="adm-dt-check">
                          {(!isSelectable || isSelectable(row)) && <input type="checkbox" aria-label={`Chọn ${rowLabel ? rowLabel(row) : key}`} checked={checked} onChange={() => toggle(key)} />}
                        </td>
                      )}
                      {expand && (
                        <td className="adm-dt-check">
                          {detail && <button type="button" className="adm-dt-expand" aria-expanded={isOpen} aria-label={isOpen ? 'Thu gọn' : 'Xem chi tiết'} onClick={() => toggleOpen(key)}><Icon name="chevron-right" /></button>}
                        </td>
                      )}
                      {columns.map(column => (
                        <td key={column.key} className={[column.align === 'right' ? 'adm-num' : '', column.nowrap ? 'adm-nowrap' : '', column.className || ''].filter(Boolean).join(' ') || undefined}>
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {detail && isOpen && (
                      <tr className="adm-dt-detail"><td colSpan={span}>{detail}</td></tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pagination && !error && (
        <div className="adm-pager">
          <span role="status" aria-live="polite">{rangeText(pagination.page, pagination.size, pagination.totalElements)}{sortColumn && pagination.totalPages > 1 ? ' · sắp xếp trong trang này' : ''}</span>
          <Pagination page={pagination.page + 1} totalPages={pagination.totalPages} onPageChange={value => { clear(); pagination.onPageChange(value - 1); }} />
        </div>
      )}
    </div>
  );
}
