const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a YYYY-MM-DD string that is a real calendar date (month 1-12, day within the month, leap years). */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
