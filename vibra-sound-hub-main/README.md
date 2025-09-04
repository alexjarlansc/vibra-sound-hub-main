# Nomix

Plataforma (experimental) de streaming de música brasileira: upload de faixas, player fixo, perfil com avatar, layout glass.

## ✨ Features
- Autenticação (Supabase) com sessão persistente
- Upload de avatar com preview e reset
- Player global fixo (Header + Player fixos)
- Layout unificado com utilitário `.panel`
- Hooks utilitários (auth, trending, mobile)
- Componentes UI baseados em shadcn + Radix

## 🗂 Estrutura
```
root/
	package.json (scripts wrapper)
	vibra-sound-hub-main/
		package.json (app)
		src/
			components/
			pages/
			integrations/supabase/
			hooks/
```

## 🚀 Inicialização Rápida
Pré-requisitos: Node 18+ e npm.

Clonar e instalar:
```sh
git clone git@github.com:alexjarlansc/vibra-sound-hub-main.git
cd vibra-sound-hub-main
npm run setup   # instala dependências do app
npm run dev     # inicia Vite
```
Abrir: http://localhost:5173

## 🔐 Variáveis de Ambiente
Copie `.env.example` para `.env` dentro de `vibra-sound-hub-main/`:
```sh
cp vibra-sound-hub-main/.env.example vibra-sound-hub-main/.env
```
Valores padrão funcionam (anon key pública). Em produção use chaves próprias do seu projeto Supabase.

## 📦 Scripts (na raiz)
| Script | Ação |
|--------|------|
| `npm run setup` | Instala dependências do app |
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build produção |
| `npm run preview` | Preview local do build |
| `npm run lint` | ESLint |

## 🛠 Stack
- React 18
- Vite
- TypeScript
- Tailwind CSS + tailwind-merge + animate
- shadcn-ui / Radix Primitives
- Supabase (auth + storage futuramente)
- React Query

## 🧪 Qualidade
Não há testes ainda. Sugestão: adicionar vitest + @testing-library/react para componentes principais.

## 🌐 Deploy (Vercel)
Configuração recomendada:
| Campo | Valor |
|-------|-------|
| Root Directory | `vibra-sound-hub-main` |
| Install Command | `npm install` (ou usar root com `npm run setup`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node Version | 18+ |

Adicionar as mesmas variáveis (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## 🎵 Storage: Bucket de Músicas

Para que o upload funcione você PRECISA de um bucket de storage (default: `music`).

### Opção 1: Criar via Dashboard
1. Acesse Supabase > Storage > Buckets > Create bucket.
2. Nome: `music` (ou outro; se mudar ajuste `VITE_SUPABASE_MUSIC_BUCKET` no `.env`).
3. Marque como Public (permite leitura direta das faixas e capas).
4. Create.
5. (Opcional) Policies: garanta que a policy de leitura pública (SELECT) esteja ativa. Para uploads via cliente com anon key você pode criar uma policy restrita a usuários autenticados.

### Opção 2: Script automático
Adicione no `.env` também a `SUPABASE_SERVICE_ROLE_KEY` (NÃO commitar). Então rode na raiz:
```sh
npm run ensure:bucket
```
Esse script verifica e cria o bucket se não existir.

### Variáveis relevantes
```
VITE_SUPABASE_MUSIC_BUCKET=music
SUPABASE_SERVICE_ROLE_KEY=... (apenas local/CI)
```

### Erro "Bucket not found"
Se aparecer toast "Bucket de storage não encontrado":
Checklist:
- Bucket existe no painel e exatamente com o mesmo nome? (case sensitive)
- Variável `VITE_SUPABASE_MUSIC_BUCKET` está no `.env` e Vite foi reiniciado?
- Você está usando o projeto correto (URL e anon key conferem)?
- A build (Vercel) recebeu as mesmas variáveis de ambiente?

### Alterar nome do bucket
1. Renomear no painel NÃO é possível; crie outro bucket e ajuste `.env`.
2. Atualize `VITE_SUPABASE_MUSIC_BUCKET` e reinicie `npm run dev`.

### Tamanho e tipos aceitos
Script define limite ~100MB e mime types básicos (`audio/mpeg`, imagens). Ajuste em `scripts/ensureBucket.ts` se quiser mais formatos (ex: `audio/wav`, `audio/flac`).

### Políticas mínimas sugeridas
Para leitura pública simples:
```
-- Storage Policies (GUI facilita)
SELECT: (bucket_id = 'music')
```
Para upload somente de usuários logados:
```
INSERT: (bucket_id = 'music') AND auth.role() = 'authenticated'
```
Adapte conforme necessidade de moderação.

### Migração futura
Se quiser servir via CDN / transformações de imagem: habilite Image Transformation no painel, use URLs públicas.

Se permanecer o erro mesmo após criar o bucket, rode o script em modo debug adicionando `node --trace-warnings vibra-sound-hub-main/scripts/ensureBucket.ts` e copie a saída.

Arquivo `vercel.json` na raiz já define:
```
"buildCommand": "cd vibra-sound-hub-main && npm install && npm run build",
"outputDirectory": "vibra-sound-hub-main/dist"
```
Caso configure manualmente via dashboard, basta apontar para o subdiretório e manter os comandos acima.

## 🔒 Segurança
- Chave anon do Supabase pode ficar no cliente.
- Evite expor service_role.
- Considere RLS nas tabelas antes de abrir upload público.

## 📌 Roadmap Sugerido
- [ ] Página de listagem de músicas real (dados do Supabase)
- [ ] Upload de faixas (armazenamento + metadados)
- [ ] Likes / Play count
- [ ] Busca e filtros
- [ ] Testes unitários básicos

## 🤝 Contribuição
Branches: feature/*, fix/*, chore/* → Pull Request → main.

## 🧽 Limpeza do Histórico
Histórico foi reescrito para remover `node_modules`. Evite commitar dependências.

## 📄 Licença
Definir (MIT sugerido). Adicionar `LICENSE` se for abrir público.

---
Made with focus on DX & UI consistency.
