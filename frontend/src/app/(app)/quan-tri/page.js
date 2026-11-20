'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiFetch } from '@/lib/api-client';
import {
  RANGES, SERVICE_LABEL, USER_STATUS, ACTION_TONE, actionLabel, compactMoney, delta, linePoints, num,
  planShare, queueItems, relativeTime, scaleMax, shortDay, sparkPath,
} from '@/lib/admin-dashboard.mjs';
import styles from './page.module.css';

const PLAN_COLORS = ['var(--line-2)', 'var(--primary-fill)', 'var(--secondary)', 'var(--warning)'];

function Delta({ value, suffix }) {
  if (!value) return <span className={styles.deltaNone}>{suffix || 'chưa có cơ sở'}</span>;
  if (value.noBase) return <span className={styles.deltaNone}>{value.text}</span>;
  return <span className={`${styles.delta} ${styles[value.tone]}`}>{value.text}{suffix ? <small> {suffix}</small> : null}</span>;
}

function Spark({ values, tone = 'acc' }) {
  if (!values?.length) return null;
  return <svg className={`${styles.spark} ${styles[`spark_${tone}`]}`} viewBox="0 0 84 28" aria-hidden="true"><path d={sparkPath(values)} /></svg>;
}

function Kpi({ label, value, sub, spark, tone }) {
  return (
    <div className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      <div className={styles.kpiRow}>{sub}<Spark values={spark} tone={tone} /></div>
    </div>
  );
}

function Card({ title, sub, action, children, className = '' }) {
  return (
    <section className={`${styles.card} ${className}`}>
      <header className={styles.cardHead}>
        <h2>{title}</h2>
        {sub && <span className={styles.cardSub}>{sub}</span>}
        {action && <span className={styles.cardAction}>{action}</span>}
      </header>
      {children}
    </section>
  );
}

function ActivityChart({ days }) {
  const W = 720, H = 240, L = 40, R = 40, T = 12, B = 26;
  const learners = days.map(d => d.nguoiHoc);
  const reviews = days.map(d => d.luotOn);
  const maxL = scaleMax(Math.max(...learners, 0));
  const maxR = scaleMax(Math.max(...reviews, 0));
  const box = { width: W - L - R, height: H - T - B, left: L, top: T };
  const pl = linePoints(learners, { ...box, max: maxL });
  const pr = linePoints(reviews, { ...box, max: maxR });
  const base = T + box.height;
  const every = Math.ceil(days.length / 7);
  const slot = box.width / Math.max(1, days.length - 1);
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Hoạt động học ${days.length} ngày: người học tối đa ${Math.max(...learners, 0)}, lượt ôn tối đa ${Math.max(...reviews, 0)} mỗi ngày`}>
      {[0, 1, 2, 3, 4].map(i => {
        const y = base - (box.height * i) / 4;
        return (
          <g key={i}>
            <line className={styles.grid} x1={L} x2={W - R} y1={y} y2={y} />
            <text x={L - 8} y={y + 4} textAnchor="end">{num((maxL * i) / 4)}</text>
            <text x={W - R + 8} y={y + 4}>{num((maxR * i) / 4)}</text>
          </g>
        );
      })}
      {days.map((d, i) => (i % every === 0 || i === days.length - 1) && (
        <text key={d.ngay} x={pl[i][0]} y={H - 6} textAnchor="middle">{shortDay(d.ngay)}</text>
      ))}
      <path className={styles.area} d={`M${L},${base} ${pl.map(p => `L${p[0]},${p[1]}`).join(' ')} L${pl.at(-1)[0]},${base} Z`} />
      <polyline className={styles.lineMain} points={pl.map(p => p.join(',')).join(' ')} />
      <polyline className={styles.lineAlt} points={pr.map(p => p.join(',')).join(' ')} />
      {days.map((d, i) => (
        <rect key={d.ngay} className={styles.hit} x={pl[i][0] - slot / 2} y={T} width={slot} height={box.height}>
          <title>{`${shortDay(d.ngay)}: ${num(d.nguoiHoc)} người học · ${num(d.luotOn)} lượt ôn · ${d.dangKy} đăng ký${d.tyLeNho != null ? ` · nhớ ${num(d.tyLeNho)}%` : ''}`}</title>
        </rect>
      ))}
    </svg>
  );
}

function RevenueChart({ months }) {
  const W = 480, H = 240, L = 44, R = 6, T = 10, B = 26;
  const max = scaleMax(Math.max(...months.map(m => m.doanhThu), 0));
  const slot = (W - L - R) / months.length;
  const height = H - T - B;
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Doanh thu 12 tháng, tháng này ${compactMoney(months.at(-1).doanhThu)}`}>
      {[0, 1, 2, 3, 4].map(i => {
        const y = T + height - (height * i) / 4;
        return <g key={i}><line className={styles.grid} x1={L} x2={W - R} y1={y} y2={y} /><text x={L - 8} y={y + 4} textAnchor="end">{compactMoney((max * i) / 4).replace(' đ', '')}</text></g>;
      })}
      {months.map((m, i) => {
        const h = (m.doanhThu / max) * height;
        const x = L + slot * i + slot * 0.18;
        return (
          <g key={m.thang}>
            <rect className={i === months.length - 1 ? styles.barNow : styles.bar} x={x} y={T + height - h} width={slot * 0.64} height={Math.max(h, m.doanhThu ? 2 : 0)} rx="3">
              <title>{`Tháng ${m.thang.slice(5)}/${m.thang.slice(0, 4)}: ${num(m.doanhThu)} đ · ${m.soGiaoDich} giao dịch`}</title>
            </rect>
            <text x={x + slot * 0.32} y={H - 6} textAnchor="middle">{m.thang.slice(5)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PlanDonut({ data }) {
  const share = planShare(data);
  const r = 46, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 120 120" className={styles.donut} role="img" aria-label={`${num(share.paidPct)}% người dùng hoạt động đang trả phí`}>
        <circle cx="60" cy="60" r={r} className={styles.donutTrack} />
        {share.total > 0 && share.rows.map((row, i) => {
          const len = (row.count / share.total) * c;
          const el = <circle key={row.code} cx="60" cy="60" r={r} fill="none" stroke={PLAN_COLORS[i % PLAN_COLORS.length]} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />;
          offset += len;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" className={styles.donutValue}>{num(share.paidPct)}%</text>
        <text x="60" y="74" textAnchor="middle" className={styles.donutLabel}>trả phí</text>
      </svg>
      <ul className={styles.legendList}>
        {share.rows.map((row, i) => (
          <li key={row.code}><i style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />{row.name}<b>{num(row.count)}</b></li>
        ))}
      </ul>
    </div>
  );
}

function Pill({ tone, children }) {
  return <span className={`${styles.pill} ${styles[`pill_${tone}`] || ''}`}>{children}</span>;
}

function Loading() {
  return (
    <div className={styles.page} aria-busy="true">
      <div className={styles.kpis}>{Array.from({ length: 6 }, (_, i) => <div key={i} className={`${styles.kpi} ${styles.skeleton}`} />)}</div>
      <div className={styles.row2}><div className={`${styles.card} ${styles.skeleton} ${styles.tall}`} /><div className={`${styles.card} ${styles.skeleton} ${styles.tall}`} /></div>
      <p className="sr-only" role="status">Đang tổng hợp số liệu…</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [soNgay, setSoNgay] = useState(7);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', soNgay],
    queryFn: () => apiFetch(`/api/v1/admin/dashboard?soNgay=${soNgay}`),
    refetchInterval: 60_000,
    placeholderData: previous => previous,
  });

  const head = (
    <div className={styles.head}>
      <div>
        <h1>Bảng điều khiển</h1>
        <p>{data ? `Cập nhật ${new Date(data.capNhatAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${shortDay(data.tuNgay)} – ${shortDay(data.denNgay)} · múi giờ ${data.muiGio}` : 'Tổng quan người dùng, học tập, doanh thu và việc cần xử lý.'}</p>
      </div>
      <div className={styles.headActions}>
        <div className={styles.seg} role="radiogroup" aria-label="Khoảng thời gian">
          {RANGES.map(r => <button key={r} type="button" role="radio" aria-checked={soNgay === r} onClick={() => setSoNgay(r)}>{r} ngày</button>)}
        </div>
        <button type="button" className={styles.btn} onClick={() => refetch()} disabled={isFetching}><Icon name="refresh" />{isFetching ? 'Đang tải…' : 'Làm mới'}</button>
        <Link href="/quan-tri/thong-bao" className={`${styles.btn} ${styles.btnPrimary}`}><Icon name="plus" />Tạo thông báo</Link>
      </div>
    </div>
  );

  if (isLoading) return <div className={styles.page}>{head}<Loading /></div>;
  if (isError) return <div className={styles.page}>{head}<ErrorState title="Chưa tải được bảng điều khiển" description={error?.message} onRetry={() => refetch()} /></div>;

  const k = data.chiSo;
  const days = data.theoNgay;
  const months = data.doanhThuTheoThang;
  const queue = queueItems(data.canXuLy);
  const queueTotal = queue.reduce((sum, item) => sum + item.count, 0);
  const avgLearners = days.length ? days.reduce((s, d) => s + d.nguoiHoc, 0) / days.length : 0;
  const services = data.dichVuHomNay?.dichVu || [];
  const maxUse = Math.max(1, ...services.map(s => s.soLuotDung));
  const aiErrors = services.reduce((s, x) => s + (x.soLoi || 0) + (x.soKhongXacDinh || 0), 0);

  return (
    <div className={styles.page}>
      {head}

      <div className={styles.kpis}>
        <Kpi label="Tổng người dùng" value={num(k.tongNguoiDung)} sub={<span className={styles.kpiSub}>{num(k.dangHoatDong)} hoạt động · {num(k.biKhoa)} khóa</span>} />
        <Kpi label="Hoạt động hôm nay" value={num(k.hoatDongHomNay)} sub={<Delta value={delta(k.hoatDongHomNay, k.hoatDongHomQua)} suffix="so với hôm qua" />} spark={days.map(d => d.nguoiHoc)} />
        <Kpi label={`Đăng ký mới (${soNgay} ngày)`} value={num(k.nguoiDungMoi)} sub={<Delta value={delta(k.nguoiDungMoi, k.nguoiDungMoiKyTruoc)} suffix="kỳ trước" />} spark={days.map(d => d.dangKy)} />
        <Kpi label="Thuê bao trả phí" value={num(k.thueBaoHieuLuc)} sub={<span className={styles.kpiSub}>{data.canXuLy.thueBaoSapHetHan} sắp hết hạn</span>} tone="ok" />
        <Kpi label="Doanh thu tháng này" value={compactMoney(k.doanhThuThangNay)} sub={<Delta value={delta(k.doanhThuThangNay, k.doanhThuThangTruoc)} suffix="tháng trước" />} spark={months.map(m => m.doanhThu)} tone="ok" />
        <Kpi label={`Lượt ôn (${soNgay} ngày)`} value={num(k.luotOnTrongKy)} sub={<Delta value={delta(k.luotOnTrongKy, k.luotOnKyTruoc)} suffix="kỳ trước" />} spark={days.map(d => d.luotOn)} tone="info" />
      </div>

      <div className={styles.row2}>
        <Card title="Hoạt động học tập" sub={`${soNgay} ngày`} action={<span className={styles.legend}><span><i className={styles.dotMain} />Người học</span><span><i className={styles.dotAlt} />Lượt ôn (trục phải)</span></span>}>
          <div className={styles.bigstats}>
            <div><span>Người học trong kỳ</span><b>{num(k.nguoiHocTrongKy)}</b></div>
            <div><span>Trung bình / ngày</span><b>{num(avgLearners)}</b></div>
            <div><span>Lượt ôn</span><b>{num(k.luotOnTrongKy)}</b></div>
            <div><span>Tỷ lệ nhớ</span><b>{k.tyLeNho == null ? '—' : `${num(k.tyLeNho)}%`}</b></div>
          </div>
          <div className={styles.cardBody}><ActivityChart days={days} /></div>
        </Card>

        <Card title="Cần xử lý" sub={queueTotal ? `${num(queueTotal)} mục` : 'đã xong hết'}>
          <ul className={styles.queue}>
            {queue.map(item => {
              const inner = <>
                <span className={`${styles.qIcon} ${styles[`q_${item.tone}`]}`}><Icon name={item.icon} /></span>
                <span className={styles.qText}>{item.label}{item.overdue && <em className={styles.overdue}>quá 48 giờ</em>}</span>
                <b className={item.count ? '' : styles.zero}>{num(item.count)}</b>
              </>;
              return <li key={item.key}>{item.href && item.count ? <Link href={item.href}>{inner}</Link> : <div>{inner}</div>}</li>;
            })}
          </ul>
        </Card>
      </div>

      <div className={styles.row3}>
        <Card title="Doanh thu" sub="12 tháng" action={<Link href="/quan-tri/doanh-thu" className={styles.link}>Chi tiết</Link>}>
          <div className={styles.bigstats}>
            <div><span>Tháng này</span><b>{compactMoney(k.doanhThuThangNay)}</b></div>
            <div><span>12 tháng</span><b>{compactMoney(months.reduce((s, m) => s + m.doanhThu, 0))}</b></div>
            <div><span>Giao dịch</span><b>{num(months.reduce((s, m) => s + m.soGiaoDich, 0))}</b></div>
          </div>
          <div className={styles.cardBody}><RevenueChart months={months} /></div>
        </Card>
        <Card title="Cơ cấu gói" sub="người dùng đang hoạt động">
          <div className={styles.cardBody}><PlanDonut data={data} /></div>
        </Card>
        <Card title="Dịch vụ hôm nay" sub="lượt dùng" action={<span className={styles.cardSub}>{aiErrors ? `${aiErrors} lỗi` : 'không lỗi'}</span>}>
          <div className={styles.cardBody}>
            {services.map(s => (
              <div key={s.loai} className={styles.meter}>
                <div className={styles.meterTop}><span>{SERVICE_LABEL[s.loai] || s.loai}</span><span className={styles.mono}>{num(s.soLuotDung)} lượt · {num(s.soNguoiDung)} người</span></div>
                <div className={styles.bar2}><i style={{ width: `${(s.soLuotDung / maxUse) * 100}%` }} /></div>
                {(s.soLoi || s.soKhongXacDinh) ? <p className={styles.meterErr}>{s.soLoi || 0} lỗi · {s.soKhongXacDinh || 0} chưa rõ kết quả</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.row2}>
        <Card title="Bộ mẫu được học nhiều" sub={`${soNgay} ngày, tính cả bản sao`} action={<Link href="/quan-tri/bo-mau" className={styles.link}>Quản lý bộ mẫu</Link>}>
          {data.boMauNoiBat.length ? (
            <div className={styles.tableWrap}><table className={styles.table}>
              <thead><tr><th>Bộ mẫu</th><th className={styles.r}>Người học</th><th className={styles.r}>Lượt ôn</th><th className={styles.r}>Tỷ lệ nhớ</th></tr></thead>
              <tbody>{data.boMauNoiBat.map(d => (
                <tr key={d.id}><td><Link href={`/quan-tri/bo-mau?id=${d.id}`}>{d.ten}</Link></td><td className={styles.r}>{num(d.soNguoiHoc)}</td><td className={styles.r}>{num(d.soLuotOn)}</td><td className={styles.r}>{d.tyLeNho == null ? '—' : `${num(d.tyLeNho)}%`}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <p className={styles.empty}>Chưa có lượt ôn nào trên bộ mẫu trong {soNgay} ngày qua.</p>}
        </Card>
        <Card title="Nhật ký gần đây" action={<Link href="/quan-tri/nhat-ky" className={styles.link}>Mở nhật ký</Link>}>
          {data.nhatKyGanDay.length ? (
            <ul className={styles.feed}>
              {data.nhatKyGanDay.map(log => (
                <li key={log.id} className={styles[`feed_${ACTION_TONE[log.hanhDong] || 'acc'}`]}>
                  <span><b>{log.nguoiThucHien?.tenHienThi || 'Quản trị viên'}</b> {actionLabel(log.hanhDong)} <code>{log.doiTuong?.ten}</code></span>
                  <time dateTime={log.createdAt} title={new Date(log.createdAt).toLocaleString('vi-VN')}>{relativeTime(log.createdAt)}</time>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>Chưa có thao tác quản trị nào.</p>}
        </Card>
      </div>

      <div className={styles.row2}>
        <Card title="Người dùng mới" sub="đăng ký gần nhất" action={<Link href="/quan-tri/tai-khoan" className={styles.link}>Tất cả tài khoản</Link>}>
          <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th>Người dùng</th><th>Đăng ký</th><th>Trạng thái</th><th>Gói</th></tr></thead>
            <tbody>{data.nguoiDungMoi.map(u => {
              const [label, tone] = USER_STATUS[u.trangThai] || [u.trangThai, 'mute'];
              return (
                <tr key={u.id}>
                  <td><Link href={`/quan-tri/tai-khoan?q=${encodeURIComponent(u.email)}`} className={styles.who}><span className={styles.av}>{(u.tenHienThi || u.email).trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase()}</span><span><b>{u.tenHienThi}</b><small>{u.email}</small></span></Link></td>
                  <td className={styles.mono}>{relativeTime(u.createdAt)}</td>
                  <td><Pill tone={tone}>{label}</Pill></td>
                  <td>{u.goiMa ? <Pill tone="acc">{u.goiMa}</Pill> : <Pill tone="mute">Miễn phí</Pill>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </Card>
        <Card title="Tình trạng hệ thống" sub="kiểm tra lúc tải trang">
          <div className={styles.health}>
            <div><span><b>API</b><small>đang trả lời</small></span><Pill tone="ok">UP</Pill></div>
            <div><span><b>MySQL</b><small>truy vấn tổng hợp</small></span><Pill tone={data.heThong.csdl === 'UP' ? 'ok' : 'bad'}>{data.heThong.csdl}</Pill></div>
            <div><span><b>Redis</b><small>phiên đăng nhập, hạn mức</small></span><Pill tone={data.heThong.redis === 'UP' ? 'ok' : 'bad'}>{data.heThong.redis}</Pill></div>
            <div><span><b>Tác vụ nền</b><small>{num(data.heThong.tacVuCho)} đang chờ · {num(data.heThong.tacVuLoi24h)} lỗi 24h</small></span><Pill tone={data.heThong.tacVuLoi24h ? 'warn' : 'ok'}>{data.heThong.tacVuLoi24h ? 'CÓ LỖI' : 'ỔN'}</Pill></div>
            <div><span><b>Dịch vụ AI</b><small>{aiErrors} lỗi hôm nay</small></span><Pill tone={aiErrors ? 'warn' : 'ok'}>{aiErrors ? 'CÓ LỖI' : 'ỔN'}</Pill></div>
            <div><span><b>Tài khoản</b><small>{num(k.soQuanTri)} quản trị · {num(k.chuaXacThuc)} chưa xác thực</small></span><Pill tone="mute">{num(k.tongNguoiDung)}</Pill></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
