import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_REASONS, USER_REPORT_REASONS, isUnavailableUser, reportReasons } from '../src/lib/share.mjs';
import { REPORT_REASON, REPORT_STATUS, TARGET_TYPE, contentLink } from '../src/lib/admin-ops.mjs';

test('user reports use their own reason set, ending with KHAC', () => {
  assert.equal(reportReasons('NGUOI_DUNG'), USER_REPORT_REASONS);
  assert.equal(reportReasons('BO_THE'), REPORT_REASONS);
  assert.deepEqual(USER_REPORT_REASONS.map(r => r.value),
    ['ANH_DAI_DIEN_NHAY_CAM', 'TEN_KHONG_PHU_HOP', 'SPAM', 'MAO_DANH', 'QUAY_ROI', 'KHAC']);
  USER_REPORT_REASONS.forEach(reason => assert.ok(REPORT_REASON[reason.value]));
});

test('isUnavailableUser only matches the backend 404 marker', () => {
  assert.equal(isUnavailableUser({ status: 404, data: { details: { lyDo: 'NGUOI_DUNG_KHONG_KHA_DUNG' } } }), true);
  assert.equal(isUnavailableUser({ status: 404, data: {} }), false);
  assert.equal(isUnavailableUser({ status: 403, data: { details: { lyDo: 'NGUOI_DUNG_KHONG_KHA_DUNG' } } }), false);
  assert.equal(isUnavailableUser(null), false);
});

test('admin labels cover user reports and the locked status', () => {
  assert.equal(TARGET_TYPE.NGUOI_DUNG, 'Người dùng');
  assert.equal(REPORT_STATUS.DA_KHOA[0], 'Đã khóa');
  assert.equal(contentLink({ loaiDoiTuong: 'NGUOI_DUNG', doiTuongId: '9', noiDung: {} }), '/quan-tri/tai-khoan?nguoi=9');
});
