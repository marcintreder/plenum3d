import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../../components/LandingPage/Hero';
import { Features } from '../../components/LandingPage/Features';

describe('Hero', () => {
  it('renders an h1 with text', () => {
    render(<Hero onLaunch={() => {}} />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent.length).toBeGreaterThan(0);
  });
});

describe('Features', () => {
  it('renders exactly 6 feature cards', () => {
    render(<Features />);
    const cards = screen.getAllByTestId('feature-card');
    expect(cards).toHaveLength(6);
  });
});
