import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../../components/LandingPage/Hero';
import { Features } from '../../components/LandingPage/Features';

describe('Hero', () => {
  it('renders a headline', () => {
    const mockDesign = { headline: 'Test', subheadline: 'Test', cta: 'Test' };
    render(<Hero design={mockDesign} onLaunch={() => {}} />);
    expect(screen.getByText('Test')).toBeDefined();
  });
});

describe('Features', () => {
  it('renders 4 feature cards', () => {
    render(<Features design={[]} />);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(4);
  });
});
