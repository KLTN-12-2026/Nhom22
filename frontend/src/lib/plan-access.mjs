export const FEATURES = {
  AI: { label: 'AI văn bản', unit: 'lượt AI', quota: 'hanMucAi', icon: 'sparkles' },
  ANH: { label: 'Ảnh AI', unit: 'ảnh AI', quota: 'hanMucAnh', icon: 'image' },
  TTS: { label: 'Giọng đọc mẫu', unit: 'lượt nghe giọng mẫu', quota: 'hanMucTts', icon: 'volume' },
  PHAT_AM: { label: 'Chấm phát âm', unit: 'lượt chấm phát âm', quota: 'hanMucPhatAm', flag: 'phatAm', icon: 'mic' },
  GIOI_HAN_THE: { label: 'Số thẻ tối đa', limit: 'gioiHanThe', icon: 'decks' }
};

export const plansKey = ['billing', 'plans'];
export const quotaKey = ['service-quota'];
export const cardUsageKey = ['card-usage'];

const paid = plans => (plans || []).filter(p => p.giaThang > 0).sort((a, b) => a.giaThang - b.giaThang);

export function planValue(plan, feature) {
  const f = FEATURES[feature];
  if (!plan || !f) return 0;
  if (f.limit) return plan[f.limit] == null ? Infinity : plan[f.limit];
  if (f.flag && !plan[f.flag]) return 0;
  if (f.quota) return plan[f.quota] ?? 0;
  return 1;
}

export function planAllows(plan, feature) {
  return planValue(plan, feature) > 0;
}

export function nextPlanFor(plans, feature, currentCode, needed = 0) {
  const current = (plans || []).find(p => p.ma === currentCode);
  const base = Math.max(planValue(current, feature), needed);
  return paid(plans).find(p => p.ma !== currentCode && planValue(p, feature) > base) || null;
}

export function lowestPlanFor(plans, feature) {
  const sorted = [...(plans || [])].sort((a, b) => a.giaThang - b.giaThang);
  return sorted.find(p => planAllows(p, feature)) || null;
}

export function access({ plans, planCode, admin = false, quota, feature }) {
  const current = (plans || []).find(p => p.ma === planCode);
  const item = quota?.hanMuc?.find(h => h.loai === feature);
  const limit = item ? item.gioiHan : planValue(current, feature);
  const remaining = item ? item.conLai : null;
  const allowed = admin || limit > 0;
  const exhausted = !admin && allowed && remaining === 0;
  const upgrade = admin ? null : nextPlanFor(plans, feature, planCode);
  return {
    feature,
    allowed,
    locked: !allowed,
    exhausted,
    limit: Number.isFinite(limit) ? limit : null,
    remaining,
    upgrade,
    required: allowed ? null : lowestPlanFor(plans, feature)
  };
}

export function upgradeFromError(status, data, plans, planCode) {
  const details = data?.details;
  if (!details?.quyenLoi) return null;
  if (status === 429 && details.quyenLoi === 'HAN_MUC') {
    const feature = details.loai;
    return { feature, reason: 'HET_LUOT', message: data.message, target: nextPlanFor(plans, feature, planCode, details.gioiHan) };
  }
  if (status === 422 && FEATURES[details.quyenLoi]) {
    const target = (plans || []).find(p => p.ma === details.goiCanNangCap) || nextPlanFor(plans, details.quyenLoi, planCode);
    return { feature: details.quyenLoi, reason: 'KHONG_CO_QUYEN', message: data.message, target };
  }
  return null;
}

export function formatLimit(value) {
  if (value == null || value === Infinity) return 'Không giới hạn';
  return Number(value).toLocaleString('vi-VN');
}

export function usageLevel(used, limit) {
  if (limit == null) return 'ok';
  const ratio = limit === 0 ? 1 : used / limit;
  if (ratio >= 1) return 'full';
  if (ratio >= 0.8) return 'near';
  return 'ok';
}
