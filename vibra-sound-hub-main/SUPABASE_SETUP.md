Configuração rápida do Supabase para o projeto

1) Criar uma cópia de `.env.example` para `.env`

No Windows PowerShell (na raiz do projeto):

```powershell
copy .env.example .env
# Abra .env e substitua VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY pelos valores do seu projeto Supabase
notepad .env
```

2) Aplicar as views recomendadas
- Abra o dashboard do Supabase > SQL Editor
- Cole o conteúdo de `supabase/sql/views.sql` (neste repositório) e rode (Run)
- As views criadas são: `track_trending_view`, `album_trending_view`, `profile_trending_view`

3) Verificar tabelas mínimas esperadas
- `tracks` (id, filename, file_url, album_id, user_id, created_at)
- `albums` (id, name, cover_url, user_id, created_at)
- `profiles` (id, username, avatar_url, created_at)
- `track_plays` (id, track_id, created_at, user_id)
- `track_likes` (id, track_id, user_id, created_at)
- `album_likes`, `album_downloads`, `playlist_tracks` (opcionais conforme features)

4) Políticas RLS mínimas (se usar RLS)
- Permitir leitura pública das views: `track_trending_view`, `album_trending_view`, `profile_trending_view` para `anon` role.
- Permitir inserts para `track_plays` com usuário autenticado.

5) Rodar localmente
- No terminal PowerShell na raiz do projeto:

```powershell
npm install
npm run dev
```

Notas de segurança
- Não compartilhe suas keys privadas. Use apenas `VITE_SUPABASE_ANON_KEY` em front-end. Para operações sensíveis, use funções no banco ou um servidor backend com service role key (MANIPULATE COM CUIDADO).

Se quiser, eu posso:
- Gerar políticas RLS sugeridas (SQL) para aplicar no Supabase.
- Adaptar as views para nomes de colunas/tabelas personalizados (me diga seu esquema).
- Rodar `npm run dev` aqui para um smoke test, desde que você tenha colocado as variáveis no `.env` local.
