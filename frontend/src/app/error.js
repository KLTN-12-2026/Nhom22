'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Đã xảy ra lỗi</h1>
        <p>{error?.message || 'Lỗi không xác định'}</p>
        <button onClick={reset}>Thử lại</button>
      </body>
    </html>
  );
}
