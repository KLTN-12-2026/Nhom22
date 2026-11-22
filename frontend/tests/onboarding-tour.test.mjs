import { test } from 'node:test';
import assert from 'node:assert/strict';
import { continuePath, isForward, isTourActive, LIBRARY_PATH, missionStates, tourCue } from '../src/lib/onboarding-tour.mjs';

const tour = (buocHuongDan, extra = {}) => ({ buocHuongDan, boKhoiDongId: '11', boKhoiDongNguonId: '5', boSaoChepId: null, ...extra });

test('tour is active only between start and finish', () => {
  assert.equal(isTourActive('CHUA_BAT_DAU'), false);
  assert.equal(isTourActive('HOC_BO_KHOI_DONG'), true);
  assert.equal(isTourActive('THEM_TU'), true);
  assert.equal(isTourActive('HOAN_TAT'), false);
  assert.equal(isTourActive('BO_QUA'), false);
  assert.equal(isTourActive(undefined), false);
});

test('steps only move forward', () => {
  assert.equal(isForward('HOC_BO_KHOI_DONG', 'XEM_TONG_KET'), true);
  assert.equal(isForward('XEM_TONG_KET', 'HOC_BO_KHOI_DONG'), false);
  assert.equal(isForward('THEM_TU', 'THEM_TU'), false);
});

test('mission checklist marks done, current and todo', () => {
  assert.deepEqual(missionStates('SAO_CHEP_THU_VIEN').map(m => m.status), ['done', 'done', 'current', 'todo']);
  assert.deepEqual(missionStates('MO_BO_SAO_CHEP').map(m => m.status), ['done', 'done', 'current', 'todo']);
  assert.deepEqual(missionStates('HOAN_TAT').map(m => m.status), ['done', 'done', 'done', 'done']);
});

test('first mission forces the start button on today and both session controls on first card', () => {
  const today = tourCue(tour('HOC_BO_KHOI_DONG'), '/hom-nay');
  assert.equal(today.mode, 'force');
  assert.deepEqual(today.targets, ['[data-tour="resume-session"]', '[data-tour="start-session"]']);
  assert.equal(today.code, 'Nhiệm vụ 1/4');

  const session = tourCue(tour('HOC_BO_KHOI_DONG'), '/hoc-phien');
  assert.ok(session.steps['[data-tour="flip"]']);
  assert.ok(session.steps['[data-tour="rates"]']);
  assert.equal(tourCue(tour('HOC_BO_KHOI_DONG'), '/hoc-phien', { sessionRated: 1 }), null);
  assert.equal(tourCue(tour('HOC_BO_KHOI_DONG'), '/hoc-tong-ket').advanceTo, 'XEM_TONG_KET');
  assert.equal(tourCue(tour('HOC_BO_KHOI_DONG'), '/thong-ke'), null);
});

test('summary explains spacing then sends the learner to library', () => {
  const cue = tourCue(tour('XEM_TONG_KET'), '/hoc-tong-ket');
  assert.equal(cue.lockTarget, true);
  assert.deepEqual(cue.action, { label: 'Hiểu rồi, sang thư viện', advanceTo: 'SAO_CHEP_THU_VIEN', go: LIBRARY_PATH });
});

test('library step never points at the starter source deck', () => {
  const cue = tourCue(tour('SAO_CHEP_THU_VIEN'), '/thu-vien');
  assert.equal(cue.targets[0], '[data-tour-deck]:not([data-tour-deck="5"]):not([data-tour-copied]) [data-tour="deck-title"]');
  assert.equal(cue.targets[1], '[data-tour-deck]:not([data-tour-deck="5"]) [data-tour="deck-title"]');
  const detail = tourCue(tour('SAO_CHEP_THU_VIEN'), '/thu-vien/42');
  assert.equal(detail.advanceOn, '[data-tour="open-copy"]');
  assert.deepEqual(detail.targets, ['[data-tour="open-copy"]', '[data-tour="copy-deck"]']);
});

test('opening the copied deck advances to the optional add-word mission', () => {
  const copied = tour('MO_BO_SAO_CHEP', { boSaoChepId: '77' });
  assert.equal(tourCue(copied, '/bo-the').targets[0], '[data-tour-deck="77"] [data-tour="deck-title"]');
  assert.equal(tourCue(copied, '/bo-the/77').advanceTo, 'THEM_TU');
  assert.equal(tourCue(copied, '/bo-the/11'), null);
  const add = tourCue(tour('THEM_TU', { boSaoChepId: '77' }), '/bo-the/77');
  assert.equal(add.mode, 'hint');
  assert.equal(add.action.advanceTo, 'HOAN_TAT');
});

test('continue path resumes where the learner stopped', () => {
  assert.equal(continuePath(tour('HOC_BO_KHOI_DONG')), '/hom-nay');
  assert.equal(continuePath(tour('SAO_CHEP_THU_VIEN')), LIBRARY_PATH);
  assert.equal(continuePath(tour('MO_BO_SAO_CHEP')), '/bo-the');
  assert.equal(continuePath(tour('THEM_TU', { boSaoChepId: '77' })), '/bo-the/77');
  assert.equal(continuePath(tour('THEM_TU')), '/bo-the/11');
});

test('no cue when the tour is finished or skipped', () => {
  assert.equal(tourCue(tour('HOAN_TAT'), '/hom-nay'), null);
  assert.equal(tourCue(tour('BO_QUA'), '/hom-nay'), null);
});
