import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Carrega variáveis de ambiente definidas em .env (.env.example fornece modelo)
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url) {
  console.warn('[Supabase] VITE_SUPABASE_URL ausente. Verifique seu arquivo .env');
}
if (!anonKey) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY ausente. Verifique seu arquivo .env');
}

export const SUPABASE_URL = url ?? 'https://cfuqwvxbwhgfpkvzvnaw.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = anonKey ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdXF3dnhid2hnZnBrdnp2bmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzg5MTYsImV4cCI6MjA3MTgxNDkxNn0.1eoUcnyND7L4l3gmKMLCn4q5t06bVR4En4o7FO1c2Pk';

// Uso: import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Expor para debug rápido no navegador durante desenvolvimento
if (import.meta.env.DEV) {
  try { (window as any).__supabase = supabase; } catch(e) {}
}