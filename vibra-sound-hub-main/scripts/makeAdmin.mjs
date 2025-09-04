#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

/**
 * Uso:
 * 1. Defina variáveis de ambiente antes de rodar:
 *    - VITE_SUPABASE_URL ou SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY (NUNCA commitar essa chave!)
 * 2. Rode:
 *    npm run make:admin -- <user-uuid> [username]
 */

const args = process.argv.slice(2);
if(args.length < 1){
  console.error('Informe o UUID do usuário. Opcional: username.');
  process.exit(1);
}
const userId = args[0];
const username = args[1];

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !serviceKey){
  console.error('Defina VITE_SUPABASE_URL (ou SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken:false, persistSession:false } });

(async()=>{
  try {
    // garante que exista linha em profiles
    const { data: existing, error: selErr } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if(selErr){ throw selErr; }

    if(!existing){
      const insertObj = { id: userId, role: 'admin', username: username || null };
      const { error: insErr } = await supabase.from('profiles').insert(insertObj).single();
      if(insErr) throw insErr;
      console.log('Perfil criado como admin.');
    } else {
      const { error: updErr } = await supabase.from('profiles').update({ role: 'admin', ...(username ? { username } : {}) }).eq('id', userId);
      if(updErr) throw updErr;
      console.log('Perfil atualizado para admin.');
    }

    const { data: check, error: chkErr } = await supabase.from('profiles').select('id, role, username').eq('id', userId).maybeSingle();
    if(chkErr) throw chkErr;
    console.log('Resultado final:', check);
    console.log('Pronto. Faça logout/login no app para refletir.');
  } catch(e){
    console.error('Erro:', e.message || e);
    process.exit(1);
  }
})();
