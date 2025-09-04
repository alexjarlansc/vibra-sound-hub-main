# Guia Rápido de Deploy / Ambiente

## 1. Pré-requisitos
- Node 18+ (recomendado 20 LTS se quiser atualizar depois). Projeto agora alinhado para Vite 5.
- Conta Supabase com as tabelas/migrations aplicadas.

## 2. Variáveis de Ambiente
Crie `.env.local` na raiz do app (`vibra-sound-hub-main/`):
```
VITE_SUPABASE_URL=...sua_url...
VITE_SUPABASE_ANON_KEY=...sua_anon_key...
VITE_SUPABASE_MUSIC_BUCKET=music
```
Para o script opcional de bucket (local ou CI) adicionar:
```
SUPABASE_SERVICE_ROLE_KEY=...service_role...
```
(Não commit!)

## 3. Instalação
Na raiz do repositório:
```
npm run setup
```
Isso instala dependências do app interno.

## 4. Desenvolvimento
```
npm run dev
```
Acessar: http://localhost:5173

## 5. Migrations (Supabase)
Suba cada arquivo SQL em `supabase/migrations/` via SQL editor. Ordem: antigas -> novas. Inclui funções:
- `toggle_album_like` (curtir/descurtir)
- `register_album_download` (log de download)

## 6. Storage
Crie bucket `music` (Public = true para leitura). Políticas: 
- Upload apenas usuário autenticado
- Leitura pública (ou ajuste conforme necessidade)

## 7. Build / Deploy
Build local:
```
npm run build
```
Gerará `dist/`. Em Vercel: setar as envs (Production e Preview). Build command: `npm run build` e Output: `vibra-sound-hub-main/dist` se apontar subpasta, ou usar root com script wrapper.

## 8. Próximos Melhoramentos
- Subir para Node 20 e migrar Vite root para 7 se quiser features novas.
- Validar RLS para playlists e likes.
- Adicionar verificação de tipo e remover `as any` gradualmente.

## 9. Teste Rápido de Likes
1. Fazer signup/login.
2. Acessar página inicial e clicar coração numa música/álbum.
3. Ir em "Meus Favoritos" e confirmar entrada.

Pronto.
