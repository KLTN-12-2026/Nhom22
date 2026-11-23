import test from 'node:test';
import assert from 'node:assert/strict';
import { deckCover, deckMonogram } from '../src/lib/deck-illustration.mjs';

test('topic code comes from the deck title before the topic name', () => {
  assert.equal(deckCover({ ten: 'Tiếng Anh tại bệnh viện', mucTieu: 'TOEIC' }).code, 'Y TẾ');
  assert.equal(deckCover({ ten: 'Office vocabulary', tenChuDe: 'Y tế và sức khỏe cộng đồng' }).code, 'CÔNG VIỆC');
  assert.equal(deckCover({ ten: 'Bộ 1' }, 'Khoa học và Công nghệ').code, 'KHOA HỌC');
});

test('unknown topics fall back to the learning goal, then the topic name', () => {
  assert.equal(deckCover({ ten: 'B19 learner-public', mucTieu: 'TOEIC' }).code, 'TOEIC');
  assert.equal(deckCover({ ten: 'Bộ 2' }, 'Lịch sử & văn hóa').code, 'LỊCH SỬ');
  assert.equal(deckCover({}).code, 'BỘ THẺ');
});

test('monogram uses the part after an em dash and keeps Vietnamese letters', () => {
  assert.equal(deckMonogram('TOEIC trung cấp — Tài chính, nhân sự và quy trình'), 'TC');
  assert.equal(deckMonogram('Đời sống'), 'ĐS');
  assert.equal(deckMonogram(''), '·');
});

test('a sample word from the API wins over the monogram', () => {
  const cover = deckCover({ ten: 'Có gì trong bệnh viện?', tuMau: 'clinic' });
  assert.equal(cover.word, 'clinic');
  assert.equal(cover.sample, true);
});

test('tone is stable for the same topic and stays in range', () => {
  const a = deckCover({ ten: 'X', chuDeId: '17' }, 'Chủ đề lạ');
  const b = deckCover({ ten: 'Y', chuDeId: '17' }, 'Chủ đề lạ');
  assert.equal(a.tone, b.tone);
  assert.ok(a.tone >= 1 && a.tone <= 6);
});
