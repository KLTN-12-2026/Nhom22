// Local UI verification fixture. DTOs follow the implemented backend; no real account is modified.
import { createServer } from 'node:http';
let settings = { mucTieu: 'TOEIC', trinhDo: 'CO_BAN', phutMoiNgay: 10, tuMoiMoiNgay: 0, chuDeIds: ['1'], version: 0, daHoanTatKhoiDau: true };
let notifications = { nhanTrongUngDung: true, nhanEmail: false, nhacHoc: true, gioNhac: '20:30', version: 0 };
let user = { id: '1', email: 'fixture@example.test', tenHienThi: 'Người kiểm tra giao diện', muiGio: 'Asia/Ho_Chi_Minh', vaiTro: ['ADMIN', 'LEARNER'], trangThai: 'HOAT_DONG', daHoanTatKhoiDau: true };
let topics = [{ id: '1', ten: 'Kinh doanh và công việc', moTa: null, version: 0 }];
let decks = [{ id: '1', chuSoHuuId: '1', ten: 'Từ vựng tiếng Anh dành cho công việc và giao tiếp hằng ngày', moTa: 'Nghĩa tiếng Việt có dấu và mô tả nhiều dòng để kiểm tra hiển thị.', trinhDo: 'CO_BAN', chuDeId: '1', quyenTruyCap: 'RIENG_TU', trangThaiKiemDuyet: 'BINH_THUONG', yeuThich: false, createdAt: '2026-10-05T00:00:00Z', updatedAt: '2026-10-05T00:00:00Z', version: 0 }];
const page = items => ({ items, page: 0, size: 20, totalElements: items.length, totalPages: 1 });
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(data == null ? '' : JSON.stringify(data)); };
  if (path.endsWith('/csrf')) return send({ headerName: 'X-CSRF', token: 'fixture-token' });
  let body = ''; for await (const chunk of req) body += chunk;
  const data = body ? JSON.parse(body) : {};
  if (req.method !== 'GET' && req.headers['x-csrf'] !== 'fixture-token') return send({ message: 'Missing CSRF', traceId: 'fixture' }, 403);
  if (path === '/api/v1/me') { if (req.method === 'PATCH') user = { ...user, ...data }; return send(user); }
  if (path.endsWith('/learning-settings')) { if (req.method === 'PUT') { if (data.version !== settings.version || !data.mucTieu || typeof data.tuMoiMoiNgay !== 'number') return send({ message: 'Invalid settings contract' }, 400); settings = { ...settings, ...data, version: settings.version + 1 }; } return send(settings); }
  if (path.endsWith('/notification-settings')) { if (req.method === 'PUT') { if (data.version !== notifications.version || typeof data.nhanEmail !== 'boolean') return send({ message: 'Invalid notification contract' }, 400); notifications = { ...notifications, ...data, version: notifications.version + 1 }; } return send(notifications); }
  if (path === '/api/v1/public/topics') return send(page(topics));
  if (path === '/api/v1/admin/topics' || path === '/api/v1/admin/tags') { if (req.method === 'POST') topics.push({ id: String(topics.length + 1), ten: data.ten, version: 0 }); return send(req.method === 'POST' ? topics.at(-1) : page(topics)); }
  if (path === '/api/v1/decks') { if (req.method === 'POST') { if (!data.ten || !data.trinhDo || data.name) return send({ message: 'Invalid deck contract' }, 400); const deck = { ...decks[0], ...data, id: String(decks.length + 1), version: 0 }; decks.push(deck); return send(deck, 201); } return send(page(decks)); }
  const match = path.match(/^\/api\/v1\/decks\/(\d+)(\/favorite)?$/);
  if (match) { const deck = decks.find(d => d.id === match[1]); if (!deck) return send({ message: 'Not found' }, 404); if (match[2]) { deck.yeuThich = req.method === 'PUT'; return send(null, 204); } if (req.method === 'PATCH') { if (data.version !== deck.version) return send({ message: 'Version conflict' }, 409); Object.assign(deck, data, { version: deck.version + 1 }); } if (req.method === 'DELETE') { decks = decks.filter(d => d.id !== deck.id); return send(null, 204); } return send(deck); }
  return send({ message: 'Fixture does not implement this endpoint' }, 404);
}).listen(43127, '127.0.0.1', () => console.log('UI contract fixture on 43127'));
