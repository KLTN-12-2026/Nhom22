'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pill } from '@/components/admin/AdminPageHead';
import { apiFetch } from '@/lib/api-client';
import {
  RANGES, SERVICE_LABEL, USER_STATUS, actionLabel, compactMoney, delta, linePoints, num,
  planShare, queueItems, relativeTime, scaleMax, shortDay,
} from '@/lib/admin-dashboard.mjs';
import styles from './page.module.css';

const WEEKDAY = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' });
const money = value => `${num(value)} ₫`;
const initials = name => (name || '?').trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();

function DateStamp({ at }) {
  if (!at) return null;
  const date = new Date(at);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(2);
  const weekday = WEEKDAY.format(date);
  return (
    <div className={styles.stamp} aria-label={`${weekday}, ngày ${date.toLocaleDateString('vi-VN')}`}>
      <span>{weekday.charAt(0).toUpperCase() + weekday.slice(1)}</span>
      <b>{dd}.{mm}.{yy}</b>
      <span>cập nhật {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}

function Ring({ index }) {
  const paths = [
    'M52 6 C80 4 97 16 95 32 C93 50 66 57 44 55 C20 53 4 44 6 28 C8 13 30 5 58 8',
    'M48 5 C76 5 96 18 94 33 C92 51 64 56 42 54 C18 52 5 42 7 27 C9 12 32 6 56 9',
    'M50 7 C79 6 95 17 94 31 C93 49 67 56 45 55 C21 54 6 45 6 29 C6 14 29 6 57 9',
  ];
  return (
    <svg className={styles.ring} viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <path pathLength="100" d={paths[index % paths.length]} style={{ animationDelay: `${index * 140}ms` }} />
    </svg>
  );
}

function Card({ title, note, action, children, id }) {
  return (
    <section className="adm-card" aria-labelledby={id}>
      <header className="adm-card-head">
        <h2 id={id}>{title}</h2>
        {note && <span className="adm-sub">{note}</span>}
        {action && <span className="adm-card-actions">{action}</span>}
      </header>
      <div className="adm-card-body">{children}</div>
    </section>
  );
}

function Duty({ queue, oldest }) {
  const items = queueItems(queue);
  const waiting = items.filter(item => item.count > 0);
  return (
    <Card
      id="duty-h"
      title="Việc chờ xử lý"
      note={waiting.length ? `${waiting.length} mục đang chờ${oldest ? `, yêu cầu cũ nhất gửi ${relativeTime(oldest)}` : ''}` : 'không còn việc nào chờ'}
    >
      <ol className={styles.duty}>
        {items.map((item, index) => {
          const ringIndex = waiting.indexOf(item);
          return (
            <li key={item.key}>
              <span className={styles.what}>
                <b>{item.label}</b>
                {item.overdue && <small className={styles.late}>Có yêu cầu chờ quá 48 giờ</small>}
              </span>
              <span className={item.count ? styles.count : `${styles.count} ${styles.zero}`}>
                {num(item.count)}
                {item.count > 0 && <Ring index={ringIndex} />}
              </span>
              {item.count > 0 && item.href
                ? <Link className={`adm-btn adm-btn-sm${index === 0 ? ' adm-btn-primary' : ''}`} href={item.href}>{index === 0 ? 'Duyệt' : 'Xem'}</Link>
                : <span className={item.count ? styles.wait : styles.ok}>{item.count ? 'Cần kiểm tra' : 'Ổn'}</span>}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function LedgerRow({ label, now, prev, format = num, diff }) {
  const max = Math.max(now || 0, prev || 0, 1);
  const change = diff ?? (prev == null ? null : delta(now, prev));
  return (
    <tr>
      <th scope="row">{label}</th>
      <td className={`adm-num ${styles.now}`}>{now == null ? '—' : format(now)}</td>
      <td className={`adm-num ${styles.prev}`}>{prev == null ? '—' : format(prev)}</td>
      <td className={styles.barCol} aria-hidden="true">
        <span className={styles.bar}>
          <i style={{ width: `${((now || 0) / max) * 100}%` }} />
          {prev != null && <u style={{ left: `${(prev / max) * 100}%` }} />}
        </span>
      </td>
      <td className={`adm-num ${styles.diff} ${styles[change?.tone || 'flat']}`}>{change ? change.text : 'không so sánh'}</td>
    </tr>
  );
}

function Ledger({ data, soNgay, setSoNgay }) {
  const k = data.chiSo;
  return (
    <Card
      id="ledger-h"
      title="Sổ số liệu"
      note={`${soNgay} ngày, so với ${soNgay} ngày trước`}
      action={
        <div className="adm-seg" role="radiogroup" aria-label="Khoảng thời gian">
          {RANGES.map(r => <button key={r} type="button" role="radio" aria-checked={soNgay === r} onClick={() => setSoNgay(r)}>{r} ngày</button>)}
        </div>
      }
    >
      <div className="adm-table-wrap">
        <table className={`adm-table ${styles.ledger}`}>
          <caption className="sr-only">Số liệu {soNgay} ngày so với kỳ trước</caption>
          <thead>
            <tr><th scope="col">Chỉ số</th><th scope="col" className="adm-num">Kỳ này</th><th scope="col" className="adm-num">Kỳ trước</th><th scope="col" className={styles.barCol}><span className="sr-only">So sánh</span></th><th scope="col" className="adm-num">Chênh</th></tr>
          </thead>
          <tbody>
            <LedgerRow label="Người dùng mới" now={k.nguoiDungMoi} prev={k.nguoiDungMoiKyTruoc} />
            <LedgerRow label="Lượt ôn hợp lệ" now={k.luotOnTrongKy} prev={k.luotOnKyTruoc} />
            <LedgerRow label="Người học trong kỳ" now={k.nguoiHocTrongKy} prev={null} />
            <LedgerRow label="Lượt ôn mỗi người học" now={k.nguoiHocTrongKy ? Math.round((k.luotOnTrongKy / k.nguoiHocTrongKy) * 10) / 10 : null} prev={null} />
            <LedgerRow label="Tỷ lệ nhớ" now={k.tyLeNho} prev={null} format={v => `${num(v)}%`} />
          </tbody>
        </table>
      </div>
      <p className={styles.key}><span className={styles.keyBar} />Kỳ này <span className={styles.keyTick} />Kỳ trước</p>
    </Card>
  );
}

function ActivityChart({ days }) {
  const W = 720, H = 236, L = 44, R = 12, T = 12, B = 28;
  const reviews = days.map(d => d.luotOn);
  const signups = days.map(d => d.dangKy);
  const maxR = scaleMax(Math.max(...reviews, 0));
  const maxS = Math.max(...signups, 1);
  const box = { width: W - L - R, height: H - T - B, left: L, top: T };
  const points = linePoints(reviews, { ...box, max: maxR });
  const base = T + box.height;
  const every = Math.ceil(days.length / 7);
  const slot = box.width / Math.max(1, days.length - 1);
  const barW = Math.min(16, slot * 0.5);
  const peak = days.reduce((best, d) => (d.luotOn > (best?.luotOn ?? -1) ? d : best), null);
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Lượt ôn ${days.length} ngày, cao nhất ${num(peak?.luotOn)} lượt ngày ${peak ? shortDay(peak.ngay) : ''}`}>
      {Array.from({ length: 9 }, (_, i) => {
        const y = base - (box.height * i) / 8;
        return <line key={i} className={i % 2 ? styles.paper : styles.paperStrong} x1={L} x2={W - R} y1={y} y2={y} />;
      })}
      {[0, 2, 4, 6, 8].map(i => <text key={i} x={L - 8} y={base - (box.height * i) / 8 + 4} textAnchor="end">{num((maxR * i) / 8)}</text>)}
      {days.map((d, i) => (i % every === 0 || i === days.length - 1) && (
        <text key={d.ngay} x={points[i][0]} y={H - 8} textAnchor="middle">{shortDay(d.ngay)}</text>
      ))}
      {days.map((d, i) => d.dangKy > 0 && (
        <rect key={`s${d.ngay}`} className={styles.signup} x={points[i][0] - barW / 2} y={base - (d.dangKy / maxS) * box.height * 0.3} width={barW} height={(d.dangKy / maxS) * box.height * 0.3} />
      ))}
      <polyline className={styles.line} points={points.map(p => p.join(',')).join(' ')} />
      {days.length <= 31 && points.map((p, i) => <circle key={days[i].ngay} className={styles.dot} cx={p[0]} cy={p[1]} r="3.5" />)}
      {days.map((d, i) => (
        <rect key={`h${d.ngay}`} className={styles.hit} x={points[i][0] - slot / 2} y={T} width={slot} height={box.height}>
          <title>{`${shortDay(d.ngay)}: ${num(d.luotOn)} lượt ôn, ${num(d.nguoiHoc)} người học, ${d.dangKy} đăng ký${d.tyLeNho != null ? `, nhớ ${num(d.tyLeNho)}%` : ''}`}</title>
        </rect>
      ))}
    </svg>
  );
}

function RevenueChart({ months }) {
  const W = 720, H = 200, L = 52, R = 12, T = 10, B = 26;
  const max = scaleMax(Math.max(...months.map(m => m.doanhThu), 0));
  const slot = (W - L - R) / months.length;
  const height = H - T - B;
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Doanh thu 12 tháng, tháng này ${compactMoney(months.at(-1).doanhThu)}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const y = T + height - (height * i) / 4;
        return <g key={i}><line className={i % 2 ? styles.paper : styles.paperStrong} x1={L} x2={W - R} y1={y} y2={y} /><text x={L - 8} y={y + 4} textAnchor="end">{compactMoney((max * i) / 4).replace(' đ', '')}</text></g>;
      })}
      {months.map((m, i) => {
        const h = (m.doanhThu / max) * height;
        const x = L + slot * i + slot * 0.22;
        return (
          <g key={m.thang}>
            <rect className={i === months.length - 1 ? styles.colNow : styles.col} x={x} y={T + height - h} width={slot * 0.56} height={Math.max(h, m.doanhThu ? 2 : 0)}>
              <title>{`Tháng ${m.thang.slice(5)}/${m.thang.slice(0, 4)}: ${money(m.doanhThu)}, ${m.soGiaoDich} giao dịch`}</title>
            </rect>
            <text x={x + slot * 0.28} y={H - 8} textAnchor="middle">{m.thang.slice(5)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Today({ k, days, services }) {
  const today = days.at(-1);
  const change = delta(k.hoatDongHomNay, k.hoatDongHomQua);
  const errors = services.reduce((s, x) => s + (x.soLoi || 0) + (x.soKhongXacDinh || 0), 0);
  return (
    <Card id="today-h" title="Hôm nay" note={today ? shortDay(today.ngay) : null}>
      <dl className={styles.today}>
        <div>
          <dt>Người hoạt động</dt>
          <dd><b>{num(k.hoatDongHomNay)}</b>{change && <small className={styles[change.tone]}>{change.noBase ? 'hôm qua 0' : `${change.text} so với hôm qua`}</small>}</dd>
        </div>
        <div>
          <dt>Lượt ôn</dt>
          <dd><b>{num(today?.luotOn)}</b><small>{num(today?.nguoiHoc)} người học</small></dd>
        </div>
        <div>
          <dt>Đăng ký mới</dt>
          <dd><b>{num(today?.dangKy)}</b></dd>
        </div>
      </dl>
      <p className={styles.services}>
        <span>Dịch vụ:</span>{' '}
        {services.length ? services.map(s => `${SERVICE_LABEL[s.loai] || s.loai} ${num(s.soLuotDung)}`).join(' · ') : 'chưa có lượt dùng'}
        {errors > 0 && <Link className={`adm-a ${styles.late}`} href="/quan-tri/dich-vu"> · {num(errors)} lỗi</Link>}
      </p>
    </Card>
  );
}

function SystemAlert({ sys }) {
  const down = [sys.csdl !== 'UP' && 'cơ sở dữ liệu', sys.redis !== 'UP' && 'Redis'].filter(Boolean);
  if (!down.length) return null;
  return (
    <p className="adm-notice adm-notice-bad" role="alert"><Icon name="alert" />Hệ thống đang lỗi: {down.join(', ')}. Một số số liệu bên dưới có thể chưa đúng.</p>
  );
}

function Loading() {
  return (
    <div className={styles.loading} aria-busy="true">
      <div className="adm-card"><div className={styles.skeleton} /></div>
      <div className="adm-card"><div className={styles.skeleton} /></div>
      <p className="sr-only" role="status">Đang tổng hợp số liệu…</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [soNgay, setSoNgay] = useState(7);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', soNgay],
    queryFn: () => apiFetch(`/api/v1/admin/dashboard?soNgay=${soNgay}`),
    refetchInterval: 300_000,
    placeholderData: previous => previous,
  });

  const head = (
    <div className={styles.head}>
      <div>
        <h1>Sổ trực ban</h1>
        <p>Việc đang chờ ở trên, số liệu so với kỳ trước ở dưới. Số khoanh đỏ là việc cần bạn xử lý.</p>
        <div className={styles.headActions}>
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => refetch()} disabled={isFetching}><Icon name="refresh" />{isFetching ? 'Đang tải…' : 'Tải lại số liệu'}</button>
          <Link href="/quan-tri/thong-bao" className="adm-btn adm-btn-sm">Tạo thông báo</Link>
        </div>
      </div>
      <DateStamp at={data?.capNhatAt} />
    </div>
  );

  if (isLoading) return <div className="adm-page">{head}<Loading /></div>;
  if (isError) return <div className="adm-page">{head}<ErrorState title="Chưa tải được sổ trực ban" description={error?.message} onRetry={() => refetch()} /></div>;

  const k = data.chiSo;
  const months = data.doanhThuTheoThang;
  const services = data.dichVuHomNay?.dichVu || [];
  const share = planShare(data);
  const monthNow = months.at(-1);
  const monthChange = delta(k.doanhThuThangNay, k.doanhThuThangTruoc);
  const revenueNote = monthNow
    ? `tháng này ${money(k.doanhThuThangNay)}${monthChange && !monthChange.noBase ? ` (${monthChange.text} so với tháng trước)` : ''}, 12 tháng ${money(months.reduce((s, m) => s + m.doanhThu, 0))}`
    : null;

  return (
    <div className="adm-page">
      {head}
      <SystemAlert sys={data.heThong} />
      <Duty queue={data.canXuLy} oldest={data.canXuLy.congKhaiCuNhatAt} />

      <div className={styles.grid}>
        <div className={styles.stack}>
          <Ledger data={data} soNgay={soNgay} setSoNgay={setSoNgay} />
          <Card id="act-h" title="Lượt ôn mỗi ngày" note={`${shortDay(data.tuNgay)} đến ${shortDay(data.denNgay)}, cột xám là tài khoản mới`}>
            <ActivityChart days={data.theoNgay} />
          </Card>
          <Card id="rev-h" title="Doanh thu 12 tháng" note={revenueNote} action={<Link href="/quan-tri/doanh-thu" className="adm-a">Mở sổ doanh thu</Link>}>
            {monthNow ? <RevenueChart months={months} /> : <p className="adm-muted">Chưa có giao dịch nào.</p>}
          </Card>
          <Card id="top-h" title="Bộ mẫu được học nhiều" note={`${soNgay} ngày, tính cả bản sao`} action={<Link href="/quan-tri/bo-mau" className="adm-a">Quản lý bộ mẫu</Link>}>
            {data.boMauNoiBat.length ? (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th scope="col">Bộ mẫu</th><th scope="col" className="adm-num">Người học</th><th scope="col" className="adm-num">Lượt ôn</th><th scope="col" className="adm-num">Tỷ lệ nhớ</th></tr></thead>
                  <tbody>{data.boMauNoiBat.map(d => (
                    <tr key={d.id}><td><Link className="adm-a" href={`/quan-tri/bo-mau?id=${d.id}`}>{d.ten}</Link></td><td className="adm-num">{num(d.soNguoiHoc)}</td><td className="adm-num">{num(d.soLuotOn)}</td><td className="adm-num">{d.tyLeNho == null ? '—' : `${num(d.tyLeNho)}%`}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="adm-muted">Chưa có lượt ôn nào trên bộ mẫu trong {soNgay} ngày qua.</p>}
          </Card>
        </div>

        <div className={styles.stack}>
          <Today k={k} days={data.theoNgay} services={services} />

          <Card id="new-h" title="Mới vào sổ" note={`${num(k.tongNguoiDung)} tài khoản, ${num(k.biKhoa)} bị khóa, ${num(k.chuaXacThuc)} chưa xác thực`} action={<Link href="/quan-tri/tai-khoan" className="adm-a">Tất cả tài khoản</Link>}>
            {!data.nguoiDungMoi.length && <p className="adm-muted">Chưa có tài khoản mới.</p>}
            <ul className={styles.people}>
              {data.nguoiDungMoi.map(u => {
                const [label, tone] = USER_STATUS[u.trangThai] || [u.trangThai, 'mute'];
                return (
                  <li key={u.id}>
                    <Link className="adm-who" href={`/quan-tri/tai-khoan?nguoi=${u.id}`}>
                      <span className="adm-avatar-sm" aria-hidden="true">{initials(u.tenHienThi || u.email)}</span>
                      <span className="adm-who-text"><b>{u.tenHienThi}</b><small>{u.email} · {relativeTime(u.createdAt)}</small></span>
                    </Link>
                    {u.trangThai === 'HOAT_DONG' ? (u.goiMa ? <Pill tone="acc">{u.goiMa}</Pill> : <Pill>Miễn phí</Pill>) : <Pill tone={tone}>{label}</Pill>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card id="log-h" title="Nhật ký gần đây" action={<Link href="/quan-tri/nhat-ky" className="adm-a">Mở nhật ký</Link>}>
            {data.nhatKyGanDay.length ? (
              <ol className={styles.journal}>
                {data.nhatKyGanDay.map(log => (
                  <li key={log.id}>
                    <time dateTime={log.createdAt} title={new Date(log.createdAt).toLocaleString('vi-VN')}>{relativeTime(log.createdAt)}</time>
                    <span><b>{log.nguoiThucHien?.tenHienThi || 'Quản trị viên'}</b> {actionLabel(log.hanhDong)} “{log.doiTuong?.ten}”{log.lyDo && <q>{log.lyDo}</q>}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="adm-muted">Chưa có thao tác quản trị nào.</p>}
          </Card>

          <Card id="plan-h" title="Gói đang dùng" note={`${num(k.thueBaoHieuLuc)} thuê bao còn hạn, ${num(share.paidPct)}% người hoạt động trả phí`}>
            <ul className={styles.rows}>
              {share.rows.map(row => (
                <li key={row.code}>
                  <span>{row.name}</span>
                  <span className={styles.bar} aria-hidden="true"><i style={{ width: `${share.total ? (row.count / share.total) * 100 : 0}%` }} /></span>
                  <b>{num(row.count)}</b>
                </li>
              ))}
            </ul>
          </Card>

          <Card id="sys-h" title="Tình trạng hệ thống" note="kiểm tra lúc tải trang">
            <dl className="adm-kv">
              <dt>Cơ sở dữ liệu</dt><dd><Pill tone={data.heThong.csdl === 'UP' ? 'ok' : 'bad'}>{data.heThong.csdl === 'UP' ? 'Chạy tốt' : 'Lỗi'}</Pill></dd>
              <dt>Redis</dt><dd><Pill tone={data.heThong.redis === 'UP' ? 'ok' : 'bad'}>{data.heThong.redis === 'UP' ? 'Chạy tốt' : 'Lỗi'}</Pill></dd>
              <dt>Tác vụ nền</dt><dd>{num(data.heThong.tacVuCho)} đang chờ</dd>
              <dt>Quản trị viên</dt><dd>{num(k.soQuanTri)} người</dd>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
