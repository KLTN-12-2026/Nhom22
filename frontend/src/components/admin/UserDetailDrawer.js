'use client';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Icon } from '@/components/ui';
import { Pill } from '@/components/admin/AdminPageHead';
import { apiFetch } from '@/lib/api-client';
import { actionLabel, num, relativeTime, SERVICE_LABEL, shortDay } from '@/lib/admin-dashboard.mjs';
import {
  attentionFlags, CYCLE, daysLeft, DETAIL_TABS, formatMoney, heatLevel, initials, learningMax, PAYMENT_STATUS,
  PLAN_STATUS, userAuditUrl, userDetailUrl,
} from '@/lib/admin-user-detail.mjs';

const STATUS = {
  HOAT_DONG: ['Hoạt động', 'ok'],
  BI_KHOA: ['Bị khóa', 'bad'],
  CHUA_XAC_THUC: ['Chưa xác thực', 'warn'],
  DANG_XOA: ['Đang xóa', 'mute'],
};
const fullTime = iso => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const day = iso => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

function StatusPill({ map, value }) {
  const [label, tone] = map[value] || [value, 'mute'];
  return <Pill tone={tone}>{label}</Pill>;
}

function Stat({ label, value, sub }) {
  return (
    <div className="adm-ud-stat">
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Overview({ detail }) {
  const user = detail.nguoiDung;
  const flags = attentionFlags(detail);
  const plan = detail.goiHienTai;
  const left = plan ? daysLeft(plan.hetHanAt) : null;
  return (
    <>
      {flags.length > 0 && (
        <ul className="adm-ud-flags" aria-label="Cần chú ý">
          {flags.map(flag => (
            <li key={flag.text} data-tone={flag.tone}>
              <Icon name="alert" />{flag.href ? <Link className="adm-a" href={flag.href}>{flag.text}</Link> : flag.text}
            </li>
          ))}
        </ul>
      )}
      <div className="adm-ud-stats">
        <Stat label="Chuỗi ngày" value={num(detail.hocTap.chuoiNgay)} sub="ngày liên tiếp" />
        <Stat label="Lượt ôn 30 ngày" value={num(detail.hocTap.luotOn)} sub={detail.hocTap.tyLeNho == null ? 'chưa có lượt ôn' : `nhớ ${detail.hocTap.tyLeNho}%`} />
        <Stat label="Bộ thẻ" value={num(user.soBoThe)} sub={`${num(detail.hocTap.soTheDaHoc)} thẻ đã học`} />
        <Stat label="Đã chi" value={formatMoney(detail.thanhToan.tongDaChi)} sub={`${num(detail.thanhToan.soThanhCong)} giao dịch`} />
      </div>
      <h3 className="adm-section-title">Tài khoản</h3>
      <dl className="adm-kv">
        <dt>Mã</dt><dd className="adm-num">#{user.id}</dd>
        <dt>Email</dt><dd>{user.email}</dd>
        <dt>Xác thực email</dt><dd>{detail.emailXacThucAt ? fullTime(detail.emailXacThucAt) : <span className="adm-muted">Chưa xác thực</span>}</dd>
        <dt>Vai trò</dt><dd>{(user.vaiTro || []).includes('ADMIN') ? <Pill tone="acc">Quản trị</Pill> : <Pill>Người học</Pill>}</dd>
        <dt>Múi giờ</dt><dd>{detail.muiGio}</dd>
        <dt>Tạo lúc</dt><dd>{fullTime(user.createdAt)}</dd>
        <dt>Đăng nhập cuối</dt><dd>{user.dangNhapCuoiAt ? <span title={fullTime(user.dangNhapCuoiAt)}>{relativeTime(user.dangNhapCuoiAt)}</span> : <span className="adm-muted">Chưa đăng nhập</span>}</dd>
        <dt>Gói hiện tại</dt>
        <dd>{plan ? <>{plan.tenGoi || plan.goiMa} · đến {day(plan.hetHanAt)}{left !== null && <span className="adm-muted"> (còn {Math.max(left, 0)} ngày)</span>}{plan.huyAt && <> · <Pill tone="warn">Đã tắt gia hạn</Pill></>}</> : <span className="adm-muted">Miễn phí</span>}</dd>
      </dl>
      <h3 className="adm-section-title">Kiểm duyệt</h3>
      <dl className="adm-kv">
        <dt>Báo cáo đã gửi</dt><dd>{num(detail.baoCao.daGui)}</dd>
        <dt>Bị báo cáo</dt><dd>{num(detail.baoCao.biBaoCao)}{detail.baoCao.biBaoCaoChoXuLy > 0 && <span className="adm-muted"> · {num(detail.baoCao.biBaoCaoChoXuLy)} chờ xử lý</span>}</dd>
      </dl>
    </>
  );
}

function Learning({ detail }) {
  const h = detail.hocTap;
  const max = learningMax(h.theoNgay);
  return (
    <>
      <div className="adm-ud-stats">
        <Stat label="Ngày học" value={`${h.soNgayHoc}/30`} sub={h.hocCuoiNgay ? `gần nhất ${shortDay(h.hocCuoiNgay)}` : 'chưa học'} />
        <Stat label="Thẻ đã học" value={num(h.soTheDaHoc)} />
        <Stat label="Đến hạn ôn" value={num(h.soTheDenHan)} />
        <Stat label="Tạm ngưng" value={num(h.soTheTamNgung)} />
      </div>
      <h3 className="adm-section-title">Lượt ôn 30 ngày qua</h3>
      <div className="adm-heat" role="img" aria-label={`Lượt ôn 30 ngày: tổng ${h.luotOn}, ${h.soNgayHoc} ngày có học`}>
        {h.theoNgay.map(d => <span key={d.ngay} data-level={heatLevel(d.luotOn, max)} title={`${shortDay(d.ngay)}: ${d.luotOn} lượt ôn, ${d.theMoi} thẻ mới`} />)}
      </div>
      <p className="adm-hint">Ít <span className="adm-heat-key" data-level="1" /><span className="adm-heat-key" data-level="2" /><span className="adm-heat-key" data-level="3" /><span className="adm-heat-key" data-level="4" /> nhiều · tỉ lệ nhớ {h.tyLeNho == null ? '—' : `${h.tyLeNho}%`}</p>
      <h3 className="adm-section-title">Bộ thẻ cập nhật gần đây</h3>
      {detail.boThe.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Tên bộ</th><th>Quyền</th><th className="adm-num">Thẻ</th><th>Cập nhật</th></tr></thead>
            <tbody>
              {detail.boThe.map(deck => (
                <tr key={deck.id}>
                  <td>{deck.quyenTruyCap === 'CONG_KHAI' ? <Link className="adm-a" href={`/thu-vien/${deck.id}`}>{deck.ten}</Link> : deck.ten}</td>
                  <td>{deck.quyenTruyCap === 'CONG_KHAI' ? <Pill tone="acc">Công khai</Pill> : <Pill>Riêng tư</Pill>}</td>
                  <td className="adm-num">{num(deck.soThe)}</td>
                  <td title={fullTime(deck.updatedAt)}>{relativeTime(deck.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="adm-muted">Chưa tạo bộ thẻ nào.</p>}
      <h3 className="adm-section-title">Dịch vụ 30 ngày qua</h3>
      {detail.dichVu.length ? (
        <dl className="adm-kv">
          {detail.dichVu.map(s => <Fragment key={s.loai}><dt>{SERVICE_LABEL[s.loai] || s.loai}</dt><dd>{num(s.soDung)} lượt</dd></Fragment>)}
        </dl>
      ) : <p className="adm-muted">Chưa dùng dịch vụ AI nào.</p>}
    </>
  );
}

function Billing({ detail }) {
  const t = detail.thanhToan;
  return (
    <>
      <div className="adm-ud-stats">
        <Stat label="Tổng đã chi" value={formatMoney(t.tongDaChi)} />
        <Stat label="Thành công" value={num(t.soThanhCong)} />
        <Stat label="Thất bại" value={num(t.soThatBai)} />
      </div>
      <h3 className="adm-section-title">Giao dịch gần đây</h3>
      {t.ganDay.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Mã đơn</th><th>Gói</th><th className="adm-num">Số tiền</th><th>Trạng thái</th><th>Tạo lúc</th></tr></thead>
            <tbody>
              {t.ganDay.map(p => (
                <tr key={p.id}>
                  <td className="adm-num">{p.maDon}</td>
                  <td>{p.goiMa} / {CYCLE[p.chuKy] || p.chuKy}</td>
                  <td className="adm-num">{formatMoney(p.soTien)}</td>
                  <td><StatusPill map={PAYMENT_STATUS} value={p.trangThai} /></td>
                  <td title={fullTime(p.taoAt)}>{day(p.taoAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="adm-muted">Chưa có giao dịch nào.</p>}
      <h3 className="adm-section-title">Lịch sử gói</h3>
      {detail.lichSuGoi.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Gói</th><th>Trạng thái</th><th>Bắt đầu</th><th>Hết hạn</th></tr></thead>
            <tbody>
              {detail.lichSuGoi.map(s => (
                <tr key={s.id}>
                  <td>{s.tenGoi || s.goiMa}</td>
                  <td><StatusPill map={PLAN_STATUS} value={s.trangThai} /></td>
                  <td>{day(s.batDauAt)}</td>
                  <td>{day(s.hetHanAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="adm-muted">Chưa đăng ký gói trả phí nào.</p>}
      <p className="adm-hint"><Link className="adm-a" href="/quan-tri/thanh-toan">Mở trang Thanh toán</Link></p>
    </>
  );
}

function AuditTab({ userId }) {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user-audit', userId, page],
    queryFn: () => apiFetch(userAuditUrl(userId, page)),
    placeholderData: previous => previous,
  });
  if (isLoading) return <p className="adm-empty" role="status">Đang tải nhật ký…</p>;
  if (error) return <div className="adm-notice-bad" role="alert">{error.message} <button type="button" className="adm-btn adm-btn-sm" onClick={() => refetch()}>Thử lại</button></div>;
  if (!data.items.length) return <p className="adm-muted">Chưa có thao tác quản trị nào trên tài khoản này.</p>;
  return (
    <>
      <ol className="adm-ud-timeline">
        {data.items.map(log => (
          <li key={log.id}>
            <b>{log.nguoiThucHien?.tenHienThi || 'Hệ thống'}</b> {actionLabel(log.hanhDong)}
            <span className="adm-muted" title={fullTime(log.createdAt)}> · {relativeTime(log.createdAt)}</span>
            {log.lyDo && <span className="adm-quote">{log.lyDo}</span>}
          </li>
        ))}
      </ol>
      {data.totalPages > 1 && (
        <div className="adm-pager">
          <button type="button" className="adm-btn adm-btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button>
          <span className="adm-muted">Trang {page + 1}/{data.totalPages}</span>
          <button type="button" className="adm-btn adm-btn-sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}
    </>
  );
}

function Actions({ user, me, busy, onAction }) {
  const admin = (user.vaiTro || []).includes('ADMIN');
  const self = user.id === me?.id;
  return (
    <div className="adm-head-actions">
      {user.trangThai === 'HOAT_DONG' && !self && <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={() => onAction('lock', user)}><Icon name="lock" />Khóa</button>}
      {user.trangThai === 'BI_KHOA' && <button type="button" className="adm-btn" disabled={busy} onClick={() => onAction('unlock', user)}>Mở khóa</button>}
      {admin ? <button type="button" className="adm-btn" disabled={busy} onClick={() => onAction('revoke', user)}>Thu quyền quản trị</button>
        : user.trangThai === 'HOAT_DONG' && <button type="button" className="adm-btn" disabled={busy} onClick={() => onAction('grant', user)}><Icon name="shield" />Cấp quyền quản trị</button>}
    </div>
  );
}

function DetailBody({ userId, me, busy, onAction }) {
  const [tab, setTab] = useState('tong-quan');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => apiFetch(userDetailUrl(userId)),
  });
  if (isLoading) return <p className="adm-empty" role="status">Đang tải hồ sơ…</p>;
  if (error) {
    return (
      <div className="adm-notice-bad" role="alert">
        {error.status === 404 ? 'Không tìm thấy người dùng này.' : error.message}
        {error.status !== 404 && <> <button type="button" className="adm-btn adm-btn-sm" onClick={() => refetch()}>Thử lại</button></>}
      </div>
    );
  }
  const user = data.nguoiDung;
  return (
    <>
      <header className="adm-ud-head">
        <span className="adm-ud-avatar" aria-hidden="true">{initials(user.tenHienThi || user.email)}</span>
        <div>
          <h3>{user.tenHienThi}{user.id === me?.id && <span className="adm-muted"> (bạn)</span>}</h3>
          <p className="adm-muted">{user.email}</p>
          <StatusPill map={STATUS} value={user.trangThai} />
        </div>
      </header>
      <Actions user={user} me={me} busy={busy} onAction={onAction} />
      <div className="adm-seg adm-ud-tabs" role="tablist" aria-label="Nội dung hồ sơ">
        {DETAIL_TABS.map(t => <button key={t.value} type="button" role="tab" id={`ud-tab-${t.value}`} aria-controls="ud-panel" aria-selected={tab === t.value} onClick={() => setTab(t.value)}>{t.label}</button>)}
      </div>
      <div id="ud-panel" role="tabpanel" aria-labelledby={`ud-tab-${tab}`}>
        {tab === 'tong-quan' && <Overview detail={data} />}
        {tab === 'hoc-tap' && <Learning detail={data} />}
        {tab === 'thanh-toan' && <Billing detail={data} />}
        {tab === 'nhat-ky' && <AuditTab userId={userId} />}
      </div>
    </>
  );
}

export function UserDetailDrawer({ userId, onClose, me, busy, onAction }) {
  return (
    <Drawer isOpen={!!userId} onClose={onClose} title="Hồ sơ người dùng">
      {userId && <DetailBody key={userId} userId={userId} me={me} busy={busy} onAction={onAction} />}
    </Drawer>
  );
}
