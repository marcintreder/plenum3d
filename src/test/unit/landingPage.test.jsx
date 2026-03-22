import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../../components/LandingPage/Hero';
import { Features } from '../../components/LandingPage/Features';
import { SocialProof } from '../../components/LandingPage/SocialProof';
import { Footer } from '../../components/LandingPage/Footer';

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

describe('SocialProof', () => {
  it('renders exactly 3 testimonials', () => {
    render(<SocialProof />);
    const cards = screen.getAllByTestId('testimonial-card');
    expect(cards).toHaveLength(3);
  });
});

describe('Footer', () => {
  it('renders 3 link columns', () => {
    render(<Footer onLaunch={() => {}} />);
    const columns = screen.getAllByTestId('footer-column');
    expect(columns).toHaveLength(3);
  });
});
