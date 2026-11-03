import Link from 'next/link';
export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 — Không tìm thấy trang</h1>
      <p>Trang bạn yêu cầu không tồn tại.</p>
      <Link href="/">Về trang chủ</Link>
    </div>
  );
}
