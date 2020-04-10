import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('is visible', () => {
  const a = render(<App />);
  expect(a.baseElement).toBeVisible();
});
