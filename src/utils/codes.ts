/** Auto-generated, editable, sequential record codes: S00001 (sales/orders), P00001 (purchases), CU00001, SU00001. */
export type CodePrefix = 'SO' | 'PO' | 'CU' | 'SU';

const LETTERS: Record<CodePrefix, string> = { SO: 'S', PO: 'P', CU: 'CU', SU: 'SU' };

export function nextCode(prefix: CodePrefix, existing: (string | undefined | null)[]): string {
  const letter = LETTERS[prefix];
  // Accept the new format (S00001) and the legacy one (SO-00001) so the sequence continues.
  const re = new RegExp(`^(?:${letter}|${prefix}-?)(\\d+)$`, 'i');
  let max = 0;
  for (const c of existing) {
    const m = c?.trim().match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${letter}${String(max + 1).padStart(5, '0')}`;
}

/** Ensure a user-edited code is unique; append -2, -3... if it collides. */
export function uniqueCode(wanted: string, existing: (string | undefined | null)[]): string {
  const taken = new Set(existing.filter(Boolean).map((c) => c!.toLowerCase()));
  let code = wanted.trim();
  if (!taken.has(code.toLowerCase())) return code;
  let i = 2;
  while (taken.has(`${code}-${i}`.toLowerCase())) i++;
  return `${code}-${i}`;
}

export function nowStamp() {
  const d = new Date();
  return {
    iso: d.toISOString(),
    date: d.toISOString().split('T')[0],
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/** Human date + time for any stored ISO / date / date+time value. */
export function fmtDateTime(date?: string | null, time?: string | null): string {
  if (!date) return '—';
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date);
  if (isNaN(d.getTime())) return `${date}${time ? ` ${time}` : ''}`;
  const day = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });
  const t = time || (date.length > 10 ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
  return t ? `${day} · ${t}` : day;
}
