import { NOTEBOOK_SEED } from './seed';

const stores = globalThis.__vocabDot2MockStores ??= new Map();

export function mockStore(req) {
  const owner = req.cookies.get('SESSION')?.value || 'anonymous';
  if (!stores.has(owner)) {
    stores.set(owner, { sessions: new Map(), attempts: [], notebook: structuredClone(NOTEBOOK_SEED), hidden: new Set() });
  }
  return stores.get(owner);
}

export const visibleNotebook = store => store.notebook.filter(item => !store.hidden.has(item.theId));

export const newId = prefix => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function recordMistake(store, snapshot, { nhomLoi, traLoi, dapAn, baiLuyenId, createdAt }) {
  if (!snapshot?.theId) return;
  let item = store.notebook.find(it => it.theId === snapshot.theId);
  if (!item) {
    item = { theId: snapshot.theId, tu: snapshot.tu, tuLoai: snapshot.tuLoai, phienAm: snapshot.phienAm, nghiaVi: snapshot.nghiaVi, boTheId: snapshot.boTheId || null, boTheTen: snapshot.boTheTen || null, nhomLoi: [], lyDo: [], soLanQuen: 0, ghiChu: '', danhDauThuCong: false, lanGanNhatAt: createdAt, bangChung: [] };
    store.notebook.unshift(item);
  }
  const group = item.nhomLoi.find(g => g.nhomLoi === nhomLoi);
  if (group) group.soLan++;
  else item.nhomLoi.push({ nhomLoi, soLan: 1 });
  if (nhomLoi === 'CHINH_TA' && (group?.soLan || 1) >= 2 && !item.lyDo.includes('SAI_CHINH_TA')) item.lyDo.push('SAI_CHINH_TA');
  if (nhomLoi === 'CAP_NHAM' && !item.lyDo.includes('CAP_DE_NHAM')) item.lyDo.push('CAP_DE_NHAM');
  item.bangChung = [{ nhomLoi, traLoi: traLoi || '', dapAn, baiLuyenId, createdAt }, ...item.bangChung].slice(0, 5);
  item.lanGanNhatAt = createdAt;
  store.hidden.delete(item.theId);
}
