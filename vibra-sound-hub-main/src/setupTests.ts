// Setup file for Vitest
import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Create a basic JSDOM environment for tests (ensures document/window exist)
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;

// Polyfill básico para localStorage
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = (function () {
    let store: Record<string,string> = {};
    return {
      getItem(key: string) { return store[key] ?? null; },
      setItem(key: string, value: string) { store[key] = String(value); },
      removeItem(key: string) { delete store[key]; },
      clear() { store = {}; }
    } as Storage;
  })();
}

// Mock supabase client to avoid env deps in tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) })
  }
}));
