import { http, HttpResponse } from 'msw';

export const handlers = [
  // Ping
  http.get('*/api/v1/public/ping', () => {
    return HttpResponse.json({ message: 'pong from msw' });
  }),
  
  // Auth
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({ message: 'Login success' });
  }),

  // Me
  http.get('*/api/v1/me', () => {
    return HttpResponse.json({
      id: 'u1',
      tenHienThi: 'Người học Demo',
      email: 'demo@gmail.com',
      vaiTro: ['USER'],
      trangThai: 'HOAT_DONG',
      muiGio: 'Asia/Ho_Chi_Minh',
    });
  }),
];
