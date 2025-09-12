import React from 'react';
import { JSDOM } from 'jsdom';
import { render, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

if (typeof globalThis.document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  (globalThis as unknown as { window?: Window }).window = dom.window;
  (globalThis as unknown as { document?: Document }).document = dom.window.document;
}

vi.mock('@/components/TrendingMusicsSection', () => ({
  __esModule: true,
  default: (props: { onExternalOpenChange?: (v: boolean) => void; externalOpen?: boolean }) => (
    <>
      <button data-testid="internal-open" onClick={() => props.onExternalOpenChange?.(true)}>internal-open</button>
      {props.externalOpen ? <div role="dialog" data-testid="top100">Top 100 Modal</div> : null}
    </>
  )
}));

vi.mock('@/components/CtaSection', () => ({ default: () => <div data-testid="cta" /> }));

describe('Index page (DOM)', ()=>{
  it('abre o modal Top 100 via CTA do componente de músicas', async ()=>{
    const { default: Index } = await import('../Index');
    const { container } = render(React.createElement(Index));

    // encontramos o botão interno do mock e disparamos a prop
    const btn = await within(container).findByTestId('internal-open');
    fireEvent.click(btn);

    const dialog = await within(container).findByTestId('top100');
    expect(dialog).toBeDefined();
  });
});

