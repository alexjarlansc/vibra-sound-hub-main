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
