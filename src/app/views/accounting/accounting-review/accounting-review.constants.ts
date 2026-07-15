/** Five-step order lifecycle used across order detail and accounting review. */
export const ORDER_STATUS_STEPS: { code: string; label: string }[] = [
  { code: 'REQUESTED', label: 'Requested' },
  { code: 'OFFERED', label: 'Offered' },
  { code: 'CONFIRMED', label: 'Confirmed' },
  { code: 'ACTIVE', label: 'Active' },
  { code: 'COMPLETED', label: 'Completed' },
];

/** Maps an order status code/label to a 1-based progress step (matches order detail). */
export function deriveOrderProgressStep(status?: string | null): number {
  const key = (status ?? '').trim().toLowerCase().replace(/_/g, ' ');

  const stepMap: Record<string, number> = {
    requested: 1,
    tentative: 1,
    cancelled: 1,
    refunded: 1,
    offered: 2,
    confirmed: 3,
    assigned: 4,
    scheduled: 4,
    'in prep': 4,
    accepted: 4,
    ready: 4,
    started: 4,
    'in progress': 4,
    ended: 4,
    active: 4,
    completed: 5,
    closed: 5,
  };

  return stepMap[key] ?? 1;
}
