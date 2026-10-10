import { validateAccountName } from './validate';

describe('validateAccountName', () => {
  it('rejects empty and blank names', () => {
    expect(validateAccountName('')).not.toBeNull();
    expect(validateAccountName('   ')).not.toBeNull();
  });

  it('accepts a real name', () => {
    expect(validateAccountName('Checking')).toBeNull();
  });
});
