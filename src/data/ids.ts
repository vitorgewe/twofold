import { randomUUID } from 'expo-crypto';

/** Returns a random UUID v4 string (ADR-0008). */
export const newId = (): string => randomUUID();
