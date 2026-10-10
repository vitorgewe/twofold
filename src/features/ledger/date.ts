const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a YYYY-MM-DD string. */
export const isIsoDate = (value: string): boolean => ISO_DATE.test(value);
