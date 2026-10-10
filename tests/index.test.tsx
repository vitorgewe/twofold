import { render, screen } from '@testing-library/react-native';

import Home from '../app/index';
import { strings } from '@/ui/strings';

describe('Home', () => {
  it('shows the title from strings', async () => {
    await render(<Home />);
    expect(screen.getByText(strings.home.title)).toBeTruthy();
  });
});
