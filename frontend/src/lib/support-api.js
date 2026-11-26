import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { fromApiTicket, toApiCreate } from '@/lib/support-tickets.mjs';
import { toAdminEntry, toApiRespond } from '@/lib/support-admin.mjs';

export async function listSupportTickets() {
  return (await fetchAllPages('/api/v1/support-tickets')).map(fromApiTicket);
}

export async function createSupportTicket(values) {
  return fromApiTicket(await apiFetch('/api/v1/support-tickets', {
    method: 'POST', body: JSON.stringify(toApiCreate(values)),
  }));
}

export async function listAdminSupportTickets() {
  return (await fetchAllPages('/api/v1/admin/support-tickets')).map(toAdminEntry);
}

export async function respondToSupportTicket(ticket, values) {
  return toAdminEntry(await apiFetch(`/api/v1/admin/support-tickets/${encodeURIComponent(ticket.rawId)}/respond`, {
    method: 'POST', body: JSON.stringify(toApiRespond(ticket, values)),
  }));
}
