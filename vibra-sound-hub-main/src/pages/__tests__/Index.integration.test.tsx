import React from 'react';
import { JSDOM } from 'jsdom';
import { render, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

if (typeof globalThis.document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  // @ts-expect-error test helper
  (globalThis as any).window = dom.window;
  // @ts-expect-error test helper
  (globalThis as any).document = dom.window.document;
}

// Reuse same mocks as primary test: mock TrendingMusicsSection
vi.mock('@/components/TrendingMusicsSection', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button data-testid="internal-open" onClick={() => props.onExternalOpenChange?.(true)}>internal-open</button>
      {props.externalOpen ? <div role="dialog" data-testid="top100">Top 100 Modal</div> : null}
    </div>
  )
}));

vi.mock('@/components/CtaSection', () => ({ default: () => <div data-testid="cta" /> }));
vi.mock('@/components/fallbacks/SectionSkeleton', () => ({ default: (p: any) => <div data-testid="skeleton" style={{ height: p?.height || 100 }} /> }));
vi.mock('@/components/TrendingProfilesSection', () => ({ default: () => <div data-testid="trending-profiles" /> }));
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props}>{props.children}</button> }));
vi.mock('@/hooks/useTrendingProfiles', () => ({ useTrendingProfiles: () => ({ data: [], loading: false }) }));

describe('Index integration', () => {
  it('internal-open button triggers modal via prop', async () => {
    const { default: Index } = await import('../Index');
    const { container } = render(React.createElement(Index));

    const btn = await within(container).findByTestId('internal-open');
    fireEvent.click(btn);

    const dialog = await within(container).findByTestId('top100');
    expect(dialog).toBeTruthy();
  });
});
