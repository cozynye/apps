import { uuidv7 } from 'uuidv7';

/**
 * Row id: UUID v7 (time-ordered). Where crypto.getRandomValues is unavailable the library falls
 * back to Math.random for the random bits; with the millisecond timestamp and counter this is
 * ample for ids generated on one device.
 */
export function newId(): string {
  return uuidv7();
}
