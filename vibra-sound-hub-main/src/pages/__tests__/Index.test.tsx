import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Garantia mínima de JSDOM caso o setup global não tenha sido aplicado ainda
import { JSDOM } from 'jsdom';
import { JSDOM } from 'jsdom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Inicializa JSDOM apenas se necessário e com checagens para evitar sobrescrever
if (typeof globalThis.document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  // @ts-expect-error test helper
  (globalThis as any).window = dom.window;
  // @ts-expect-error test helper
  (globalThis as any).document = dom.window.document;
  if (typeof (globalThis as any).navigator === 'undefined') {
    // @ts-expect-error test helper
    (globalThis as any).navigator = dom.window.navigator;
  }
}

// Mocks para os módulos usados por Index (devem ser declarados antes da import)
vi.mock('@/components/TrendingMusicsSection', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button data-testid="internal-open" onClick={() => props.onExternalOpenChange?.(true)}>internal-open</button>
      {props.externalOpen ? <div role="dialog" data-testid="top100">Top 100 Modal</div> : null}
    </>
  )
}));

vi.mock('@/components/CtaSection', () => ({ default: () => <div data-testid="cta" /> }));
vi.mock('@/components/fallbacks/SectionSkeleton', () => ({ default: (p: any) => <div data-testid="skeleton" style={{ height: p?.height || 100 }} /> }));
vi.mock('@/components/TrendingProfilesSection', () => ({ default: () => <div data-testid="trending-profiles" /> }));
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props}>{props.children}</button> }));
vi.mock('@/hooks/useTrendingProfiles', () => ({ useTrendingProfiles: () => ({ data: [], loading: false }) }));

// Polyfill localStorage quando necessário
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = (function () {
    let store: Record<string,string> = {};
    return {
      getItem(key: string) { return store[key] ?? null; },
      setItem(key: string, value: string) { store[key] = String(value); },
      removeItem(key: string) { delete store[key]; },
      clear() { store = {}; }
    } as Storage;
  })();
}

describe('Index page (DOM)', ()=>{
  it('abre o modal Top 100 ao clicar em OUVIR TOP MÚSICAS', async ()=>{
    const { default: Index } = await import('../Index');
    render(<Index />);

    const { container } = render(React.createElement(Index));
    const btn = await within(container).findByRole('button', { name: /OUVIR TOP MÚSICAS/i });
    fireEvent.click(btn);

    const dialog = await within(container).findByTestId('top100');
    expect(dialog).toBeDefined();
  });
});

