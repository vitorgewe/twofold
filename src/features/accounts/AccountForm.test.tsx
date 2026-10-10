import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountForm } from './AccountForm';

jest.mock('@/data/database', () => ({ getDatabase: jest.fn() }));
jest.mock('@/data/accounts', () => ({
  AccountError: class AccountError extends Error {},
  createAccount: jest.fn(),
}));

describe('AccountForm', () => {
  it('shows an error and does not close when the name is empty', async () => {
    const onDone = jest.fn();
    await render(<AccountForm onDone={onDone} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save account' }));
    expect(screen.getByText('Enter an account name.')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });
});
