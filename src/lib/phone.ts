/** Algerian phone: mobile 05/06/07 + 8 digits, or landline 0 + 8 digits; +213 / 00213 prefixes accepted. */
export function normalizeDzPhone(raw: string): string | null {
  let p = raw.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  if (/^0[567]\d{8}$/.test(p)) return p;
  if (/^0[2-49]\d{7}$/.test(p)) return p;
  return null;
}
