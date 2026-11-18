'use client';
export function PronunciationResult({ data }) {
  if (!data) return null;
  return <section><h2>Kết quả phát âm</h2><p>{data.vanBanMau} · {data.moPhong ? 'Nhà cung cấp mô phỏng' : data.nhaCungCap}</p><dl>{[['tongDiem','Tổng điểm'],['doChinhXac','Độ chính xác'],['doTroiChay','Độ trôi chảy'],['doDayDu','Độ đầy đủ']].map(([k,l])=><div key={k}><dt>{l}</dt><dd>{data.chiSo?.[k] == null ? 'Chưa có' : `${data.chiSo[k]}/100`}</dd></div>)}</dl>{data.chiSo?.vanBanNhanDien && <p>Nhận diện: {data.chiSo.vanBanNhanDien}</p>}{data.ghiAm?.downloadUrl && <audio controls src={data.ghiAm.downloadUrl} aria-label="Bản ghi của bạn" />}{data.soSanh?.cungThangDo && <p>Thay đổi tổng điểm so với lần trước: {data.soSanh.tongDiem ?? 'Chưa có'}</p>}</section>;
}
