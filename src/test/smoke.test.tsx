import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function HelloButton() {
  return <button>Hi</button>;
}

describe('RTL smoke test', () => {
  it('renders a component and jest-dom matchers work', () => {
    render(<HelloButton />);
    expect(screen.getByRole('button', { name: 'Hi' })).toBeInTheDocument();
  });
});
