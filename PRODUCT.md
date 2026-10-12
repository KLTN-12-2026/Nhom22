# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Product: Next.js (App Router, JavaScript) frontend calling a Spring Boot 4 API (`backend/k28`). Design mockups in `mockups/`: static HTML/CSS/JS with sample data only (no backend calls), opened directly in the browser; they are the visual source of truth FE copies into Next.js.

## Users

Vietnamese learners of English, two equal groups:
- university students preparing for TOEIC, studying on a laptop at school and on a phone while commuting;
- working adults improving everyday/office English communication with 10–20 minutes a day.

Visitors (not logged in) browse public decks; Admins manage sample content, users and reports.

## Product Purpose

VocabLearning (working name VocabFlow) is a thesis-scale website for learning English vocabulary: pick or build decks, learn new words, review on a spaced-repetition schedule (both English→Vietnamese and Vietnamese→English, tracked independently), practise with fixed exercises, and see progress. AI helps draft cards and give feedback; pronunciation is assessed through an external API. Success: a learner completes the loop "choose/create deck → learn/review → practise → see progress" and keeps coming back.

## Positioning

- Every schedule, score and reward is decided by server rules the learner can inspect; AI only drafts content that the learner reviews before saving.
- Two study directions per card with separate progress.
- "Rescue plan" after a break: a realistic multi-day plan instead of a wall of overdue cards.
- Suggestions always show their reason and evidence ("you misspelled 'receipt' 3 of the last 5 times").

## Operating Context

- Short daily sessions (5/10/20 minutes) on phone and laptop; keyboard shortcuts on desktop.
- Content: English words/phrases with part of speech, IPA, Vietnamese meaning, English example and Vietnamese translation, optional image and audio.
- Decks tagged by goal (Giao tiếp / TOEIC), topic and self-assessed level; public "Bộ mẫu" (curated) and "Người học chia sẻ" (shared by learners).
- Thesis demo on 14/12/2026 in front of a committee.

## Capabilities and Constraints

- Phase 1 (this mockup set): public pages, register/verify email/login/forgot–reset password, onboarding, profile & settings, library, public deck detail, my decks, deck/card editor, CSV import/export, admin topics & tags.
- API contract: `report/GD0_BAO_CAO_FE.md` (errors `{code, message, fieldErrors, requestId}`, CSRF, paging); endpoints per `roadmap/ROADMAP_BE.md`.
- Vietnamese UI copy; English content shown with IPA.
- Out of scope: payments, social network, native apps, offline sync.
- Undecided: final product name (VocabLearning vs VocabFlow), AI and speech providers.

## Brand Commitments

- Name in UI: VocabLearning.
- Design brief (TK §9.8): consistent Vietnamese, clear English + IPA; responsive; one main action per study screen; indigo primary, green success, amber warning, red error, never colour alone; fonts supporting Vietnamese and IPA; body ≥ 16px; skeleton, empty-with-next-step, error-with-retry, confirmation after save; keyboard shortcuts disabled while typing; short motion respecting reduced motion; Quên/Khó/Nhớ/Dễ explained, no points race.
- The user requires a look that is not generic or "AI-generated", suits English learning, easy to read, attractive.

## Evidence on Hand

- No logo, photography, testimonials or user numbers exist. Do not fabricate learner counts, ratings or quotes.
- Real sample vocabulary may be written freely (TOEIC office/finance words, everyday communication phrases).

## Product Principles

1. The word is the hero: study and card screens put the English word, IPA and meaning first.
2. Honest progress: never show mastery or numbers the data does not support.
3. Short sessions that fit a day, not streak pressure.
4. The learner stays in control of content (review before save, clear public/private).
5. Errors explain what happened and what to do next.

## Accessibility & Inclusion

Keyboard usable, visible focus, labelled forms, contrast AA, not colour-only signals, `prefers-reduced-motion`, responsive from 360px, touch targets ≥ 44px.
