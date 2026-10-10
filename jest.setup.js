/* global jest */
// expo-crypto has no native module under Jest; Node's crypto gives the same UUID v4.
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
