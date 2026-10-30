import test from 'node:test';
import assert from 'node:assert/strict';
import { deckIllustration } from '../src/lib/deck-illustration.mjs';

test('deck title selects relevant art regardless of learning goal', () => {
  assert.equal(deckIllustration({ ten: 'Tiếng Anh tại bệnh viện', mucTieu: 'TOEIC' }), 'health-cover.png');
  assert.equal(deckIllustration({ ten: 'GIAO TIẾP CƠ BẢN A1', mucTieu: 'TOEIC' }), 'everyday-cover.png');
  assert.equal(deckIllustration({ ten: 'Khởi động — TOEIC nâng cao' }), 'office-cover.png');
});

test('specific title takes precedence over broader topic', () => {
  assert.equal(deckIllustration({ ten: 'Office vocabulary', tenChuDe: 'Y tế và sức khỏe cộng đồng' }), 'office-cover.png');
});

test('topic supplies art when title has no identifiable subject', () => {
  assert.equal(deckIllustration({ ten: 'Test', tenChuDe: 'Y tế và sức khỏe cộng đồng' }), 'health-cover.png');
  assert.equal(deckIllustration({ ten: 'Bộ 1', chuDeId: '3' }, 'Khoa học và Công nghệ'), 'science-cover.png');
  assert.equal(deckIllustration({ ten: 'Bộ từ vựng 1', tenChuDe: 'Y tế và sức khỏe cộng đồng' }), 'health-cover.png');
});

test('unknown titles never receive unrelated art based only on a goal', () => {
  assert.equal(deckIllustration({ ten: 'B19 learner-public', mucTieu: 'TOEIC' }), null);
  assert.equal(deckIllustration({}), null);
});
