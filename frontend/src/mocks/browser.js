import { setupWorker } from 'msw/browser';
import { handlers } from './foundation-handlers.mjs';

export const worker = setupWorker(...handlers);
