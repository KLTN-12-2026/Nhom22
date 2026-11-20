'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { PERIODS, number, money, percent, growthText, planAmount, rangeLabel, vietnamDate, revenueUrl, yearRangeError, revenueRows, revenuePlans, revenueCsv } from '@/lib/revenue.mjs';
import styles from './page.module.css';

const subscribe = () => () => {};
const PLAN_COLORS = ['var(--primary-fill)', 'var(--secondary)', 'var(--warning-text)', 'var(--ink-3)'];
const growthClass = value => value == null || value === 0 ? '' : value > 0 ? styles.up : styles.down;

function Loading() {
  return <div className={styles.state} role="status"><div className="skeleton"><div className="sk sk-row" /><div className="sk sk-row" /><div className="sk sk-row" /></div><p>Đang tổng hợp doanh thu…</p></div>;
}

function RevenueChart({ rows, plans, selected, onSelect }) {
  const columns = useRef([]);
  const width = Math.max(720, rows.length * 52 + 66);
  const left = 54, right = 12, bottom = 260, height = 242;
  const maximum = Math.max(...rows.map(row => row.doanhThu), 1000000);
  const rawStep = maximum / 4, power = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map(n => n * power).find(n => n >= rawStep);
  const ceiling = step * 4, slot = (width - left - right) / Math.max(1, rows.length);
  const barWidth = Math.min(52, slot * .56);

  function keyDown(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % rows.length
      : event.key === 'ArrowLeft' ? (index + rows.length - 1) % rows.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : null;
    if (next !== null) {
      event.preventDefault();
      onSelect(next);
      columns.current[next]?.focus();
      columns.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(index);
    }
  }

  return <div className={styles.chartScroll} tabIndex={0} role="region" aria-label="Biểu đồ doanh thu, có thể cuộn ngang">
    <svg className={styles.chart} style={{ minWidth: Math.max(520, rows.length * 42) }} viewBox={`0 0 ${width} 300`} role="group" aria-labelledby="revenue-chart-title" aria-describedby="chart-help">
      {Array.from({ length: 5 }, (_, i) => {
        const y = bottom - height * i / 4;
        return <g key={i}><line className={styles.gridline} x1={left} y1={y} x2={width - right} y2={y} /><text x={left - 9} y={y + 4} textAnchor="end">{number(ceiling * i / 4 / 1000000)}</text></g>;
      })}
      {rows.map((row, index) => {
        const x = left + slot * index + (slot - barWidth) / 2;
        return <g key={row.tuNgay} ref={el => { columns.current[index] = el; }} className={styles.column} role="button" tabIndex={selected === index ? 0 : -1} aria-pressed={selected === index} aria-label={`${row.fullLabel}: ${money(row.doanhThu)}${row.future ? ', chưa đến kỳ' : row.partial ? ', đang diễn ra' : ''}`} onClick={() => onSelect(index)} onFocus={() => onSelect(index)} onKeyDown={event => keyDown(event, index)}>
          <title>{row.fullLabel} · {plans.map(plan => `${plan.name}: ${money(planAmount(row, plan.code))}`).join(' · ')}</title>
          <rect className={styles.hit} x={left + slot * index + 3} y={4} width={slot - 6} height={290} rx={6} />
          {row.doanhThu > 0 ? plans.map((plan, planIndex) => {
            const barHeight = planAmount(row, plan.code) / ceiling * height;
            const previous = plans.slice(0, planIndex).reduce((sum, item) => sum + planAmount(row, item.code), 0) / ceiling * height;
            return <rect key={plan.code} x={x} y={bottom - previous - barHeight} width={barWidth} height={barHeight} fill={PLAN_COLORS[planIndex % PLAN_COLORS.length]} />;
          }) : <line className={styles.zero} x1={x} x2={x + barWidth} y1={bottom} y2={bottom} />}
          <text x={left + slot * (index + .5)} y={283} textAnchor="middle">{row.short}</text>
        </g>;
      })}
    </svg>
  </div>;
}

function Composition({ plans, total }) {
  const circumference = 2 * Math.PI * 70;
  return <div className={styles.compositionBody}>
    <div className={styles.donut}>
      <svg viewBox="0 0 180 180" role="img" aria-label={`Tỷ trọng doanh thu: ${plans.map(plan => `${plan.name} ${percent(total ? plan.amount / total * 100 : 0)}`).join(', ')}`}>
        <circle cx={90} cy={90} r={70} fill="none" stroke="var(--line)" strokeWidth={20} />
        {total > 0 && plans.map((plan, index) => <circle key={plan.code} cx={90} cy={90} r={70} fill="none" stroke={PLAN_COLORS[index % PLAN_COLORS.length]} strokeWidth={20} strokeDasharray={`${circumference * plan.amount / total} ${circumference}`} strokeDashoffset={-circumference * plans.slice(0, index).reduce((sum, item) => sum + item.amount, 0) / total} />)}
      </svg>
      <div className={styles.donutCenter}><span>Tổng doanh thu</span><strong>{number(total / 1000000)}</strong><span>triệu đồng</span></div>
    </div>
    <ul className={styles.planSplit}>{plans.map((plan, index) => <li key={plan.code}><div><span className={styles.planName}><i className={styles.dot} style={{ background: PLAN_COLORS[index % PLAN_COLORS.length] }} aria-hidden="true" />Gói {plan.name}</span><strong>{percent(total ? plan.amount / total * 100 : 0)}</strong></div><small>{money(plan.amount)}</small></li>)}</ul>
  </div>;
}

function Report({ data, today }) {
  const rows = revenueRows(data, today);
  const plans = revenuePlans(rows);
  const [selection, setSelection] = useState(null);
  const defaultSelection = Math.max(0, rows.findIndex(row => row.partial) >= 0 ? rows.findIndex(row => row.partial) : rows.map(row => row.soGiaoDich > 0).lastIndexOf(true));
  const selected = selection === null ? defaultSelection : Math.min(selection, rows.length - 1);
  const row = rows[selected];
  const comparison = data.ky === 'NAM' ? `So với ${data.tuNam - (data.denNam - data.tuNam + 1)}–${data.tuNam - 1}` : `So với cả năm ${data.nam - 1}`;
  const metrics = [
    ['Tổng doanh thu', money(data.tongDoanhThu), 'Chỉ tính giao dịch thành công', 'chart'],
    ['Giao dịch thành công', number(data.soGiaoDich), `Trong giai đoạn ${rangeLabel(data)}`, 'check'],
    ['Tăng trưởng doanh thu', growthText(data.soVoiKyTruocPhanTram), comparison, 'chart', growthClass(data.soVoiKyTruocPhanTram)],
    ['Tỷ lệ thành công', data.tongQuan.tyLeThanhCong == null ? '—' : percent(data.tongQuan.tyLeThanhCong), data.tongQuan.tyLeThanhCong == null ? 'Chưa có đơn đã kết thúc' : 'Đơn tạo trong giai đoạn, không tính đơn đang chờ', 'shield'],
    ['Gói còn hiệu lực', number(data.tongQuan.soGoiHieuLuc), 'Tại thời điểm tải trang', 'user'],
    ['Sắp hết hạn 7 ngày', number(data.tongQuan.soSapHetHan7Ngay), 'Tại thời điểm tải trang', 'clock'],
  ];
  const headers = [PERIODS[data.ky], ...plans.map(plan => `Gói ${plan.name}`), 'Tổng doanh thu', 'Giao dịch thành công', 'So kỳ trước'];

  return <>
    <p className={styles.scope} role="status">Đang xem: {rangeLabel(data)} · Theo {PERIODS[data.ky].toLowerCase()} · Số liệu tính đến thời điểm tải trang.</p>
    <div className={styles.summary} aria-label="Tổng quan doanh thu">{metrics.map(([label, value, note, icon, color]) => <article className={styles.metric} key={label}><p><Icon name={icon} />{label}</p><strong className={color}>{value}</strong><small>{note}</small></article>)}</div>
    {data.soGiaoDich === 0 && <div className={styles.empty} role="status"><Icon name="chart" /><div><h2>Chưa có giao dịch thành công</h2><p>Chưa phát sinh doanh thu trong giai đoạn này. Bạn có thể chọn năm hoặc khoảng năm khác.</p></div></div>}
    <div className={styles.charts}>
      <section className={styles.card} aria-labelledby="revenue-chart-title">
        <div className={styles.cardHead}><div><h2 id="revenue-chart-title">Doanh thu theo {PERIODS[data.ky].toLowerCase()}</h2><p>{data.ky === 'NAM' ? 'Giai đoạn' : 'Năm'} {rangeLabel(data)} · Giao dịch thành công</p></div><span className={styles.unit}>Đơn vị: triệu đồng</span></div>
        <div className={styles.legend} aria-label="Chú giải biểu đồ">{plans.map((plan, index) => <span key={plan.code}><i className={styles.dot} style={{ background: PLAN_COLORS[index % PLAN_COLORS.length] }} aria-hidden="true" />Gói {plan.name}</span>)}</div>
        <RevenueChart rows={rows} plans={plans} selected={selected} onSelect={setSelection} />
        <p className={styles.chartHelp} id="chart-help">Chọn một cột để xem chi tiết. Dùng phím mũi tên để chuyển kỳ; trên điện thoại có thể cuộn biểu đồ.</p>
        {row && <div className={styles.periodDetail} role="status" aria-live="polite"><div><b>{row.fullLabel}</b><small>{row.future ? 'Chưa đến kỳ' : `${number(row.soGiaoDich)} giao dịch thành công · ${plans.map(plan => `${plan.name} ${money(planAmount(row, plan.code))}`).join(' · ')}`}</small></div><strong>{money(row.doanhThu)}</strong></div>}
      </section>
      <section className={styles.card} aria-labelledby="composition-title"><div className={styles.cardHead}><div><h2 id="composition-title">Doanh thu theo gói</h2><p>Tỷ trọng trong thời gian đang xem</p></div></div><Composition plans={plans} total={data.tongDoanhThu} /></section>
    </div>
    <section className={styles.tableSection} aria-labelledby="revenue-table-title">
      <div className={styles.tableHead}><div><h2 id="revenue-table-title">Chi tiết doanh thu</h2><p>Đối chiếu số liệu theo kỳ và từng gói dịch vụ.</p></div><span>{rows.length} {PERIODS[data.ky].toLowerCase()} · Đơn vị: VND</span></div>
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption className="sr-only">Doanh thu theo {PERIODS[data.ky].toLowerCase()} · {rangeLabel(data)}, đơn vị đồng</caption>
        <thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
        <tbody>{rows.map((item, index) => <tr key={item.tuNgay} className={selected === index ? styles.selected : ''}>
          <th scope="row" data-label="Kỳ"><button className={styles.rowButton} type="button" aria-pressed={selected === index} aria-label={`Xem ${item.fullLabel}`} onClick={() => setSelection(index)}>{item.nhan}</button>{item.partial && <span className={styles.badge}>Đang diễn ra</span>}{item.future && <small>Chưa đến kỳ</small>}</th>
          {plans.map(plan => <td key={plan.code} data-label={`Gói ${plan.name}`}>{money(planAmount(item, plan.code))}</td>)}
          <td data-label="Tổng doanh thu"><strong>{money(item.doanhThu)}</strong></td><td data-label="Giao dịch">{number(item.soGiaoDich)}</td><td data-label="So kỳ trước" className={growthClass(item.future ? null : item.growth)}>{item.future || index === 0 ? '—' : growthText(item.growth)}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row" data-label="Kỳ">Tổng cộng</th>{plans.map(plan => <td key={plan.code} data-label={`Gói ${plan.name}`}>{money(plan.amount)}</td>)}<td data-label="Tổng doanh thu">{money(data.tongDoanhThu)}</td><td data-label="Giao dịch">{number(data.soGiaoDich)}</td><td data-label="So kỳ trước" className={growthClass(data.soVoiKyTruocPhanTram)}>{growthText(data.soVoiKyTruocPhanTram)}</td></tr></tfoot>
      </table></div>
    </section>
  </>;
}

function RevenueAdmin() {
  const today = vietnamDate();
  const thisYear = Number(today.slice(0, 4));
  const [filters, setFilters] = useState({ period: 'THANG', year: thisYear, fromYear: thisYear - 4, toYear: thisYear });
  const { toast } = useToast();
  const error = yearRangeError(filters);
  const url = revenueUrl(filters);
  const report = useQuery({ queryKey: ['billing', 'revenue', url], queryFn: ({ signal }) => apiFetch(url, { signal }), enabled: !error, retry: (count, err) => ![400, 401, 403].includes(err.status) && count < 1 });
  const ready = !error && !report.isPending && !report.isError && !!report.data;
  const years = Array.from({ length: thisYear - 1999 }, (_, i) => thisYear - i);
  const update = (key, value) => setFilters(previous => ({ ...previous, [key]: value }));

  function exportCsv() {
    if (!ready) return;
    const data = report.data;
    const objectUrl = URL.createObjectURL(new Blob([revenueCsv(data, revenueRows(data, today))], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `doanh-thu-${data.ky.toLowerCase()}-${rangeLabel(data)}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    toast('Đã xuất báo cáo doanh thu theo bộ lọc hiện tại.', { variant: 'success' });
  }

  return <div className={`page ${styles.page}`}><article className="sheet" aria-labelledby="page-title">
    <nav className={styles.breadcrumb} aria-label="Đường dẫn"><Link href="/quan-tri">Quản trị</Link><span aria-hidden="true">/</span><span aria-current="page">Thống kê doanh thu</span></nav>
    <div className={styles.heading}><div className="form-head"><h1 id="page-title">Quản lý thống kê</h1><p>Theo dõi doanh thu và hiệu quả thanh toán theo từng giai đoạn.</p></div><Link className="btn btn-secondary" href="/quan-tri/thanh-toan">Xem giao dịch ↗</Link></div>
    <form className={styles.toolbar} aria-label="Bộ lọc thống kê doanh thu" onSubmit={event => event.preventDefault()}>
      <div className={styles.toolbarLeft}>
        <div className="field"><span id="period-label">Thống kê theo</span><div className={styles.period} role="group" aria-labelledby="period-label">{Object.entries(PERIODS).map(([value, label]) => <button key={value} type="button" aria-pressed={filters.period === value} onClick={() => update('period', value)}>{label}</button>)}</div></div>
        {filters.period !== 'NAM' ? <label className="field">Năm<select className="select" value={filters.year} onChange={event => update('year', Number(event.target.value))}>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label> : <div className={styles.yearRange}>
          <label className="field">Từ năm<select className="select" value={filters.fromYear} aria-describedby={error ? 'revenue-filter-error' : undefined} onChange={event => update('fromYear', Number(event.target.value))}>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
          <label className="field">Đến năm<select className="select" value={filters.toYear} aria-invalid={!!error} aria-describedby={error ? 'revenue-filter-error' : undefined} onChange={event => update('toYear', Number(event.target.value))}>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
        </div>}
      </div>
      <div className={styles.toolbarActions}><button type="button" className="btn btn-quiet" disabled={!!error || report.isFetching} onClick={() => report.refetch()}><Icon name="refresh" />Làm mới</button><button type="button" className="btn btn-secondary" disabled={!ready || report.isFetching} onClick={exportCsv}><Icon name="download" />Xuất báo cáo CSV</button></div>
    </form>
    <div aria-busy={!error && report.isFetching}>
      {error ? <div className={styles.state} role="alert" id="revenue-filter-error"><Icon name="calendar" /><h2>Khoảng năm chưa hợp lệ</h2><p>{error}</p></div>
        : report.isPending ? <Loading /> : report.isError ? <div className={styles.state} role="alert"><Icon name="alert" /><h2>{report.error.status === 403 ? 'Không có quyền truy cập' : 'Chưa tải được thống kê'}</h2><p>{report.error.message}</p><button type="button" className="btn btn-secondary" disabled={report.isFetching} onClick={() => report.refetch()}>Thử lại</button></div>
          : ready && <Report key={url} data={report.data} today={today} />}
      {!error && report.isFetching && !report.isPending && <p className={styles.scope} role="status">Đang cập nhật số liệu…</p>}
    </div>
    <details className={styles.notes}><summary>Cách tính số liệu</summary><ul>
      <li>Doanh thu chỉ gồm giao dịch thành công, theo thời điểm hoàn tất và múi giờ Việt Nam (Asia/Ho_Chi_Minh).</li>
      <li>Tỷ lệ thành công = thành công / (thành công + thất bại + hết hạn), theo đơn tạo trong giai đoạn đang xem. Đơn đang chờ không được tính.</li>
      <li>Tăng trưởng doanh thu so với giai đoạn liền trước có cùng độ dài: theo tháng/quý so với cả năm trước; theo năm so với cùng số năm liền trước. Cột “So kỳ trước” so với kỳ liền trên trong bảng. Kỳ trước bằng 0 thì hiển thị “Chưa có cơ sở”.</li>
      <li>Kỳ đang diễn ra là số lũy kế đến lúc tải; kỳ chưa bắt đầu ghi “Chưa đến kỳ”.</li>
      <li>Gói hiệu lực và sắp hết hạn tính tại thời điểm tải trang, không đổi theo kỳ doanh thu.</li>
    </ul></details>
  </article></div>;
}

export default function RevenuePage() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <RevenueAdmin /> : <div className="page sheet"><Loading /></div>;
}
