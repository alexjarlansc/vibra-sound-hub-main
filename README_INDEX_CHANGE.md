Alterações na Home (Index)

Resumo
- A página inicial (`src/pages/Index.tsx`) foi atualizada para exibir uma seção "Top Músicas e Artistas" similar ao design fornecido.
- A seção de músicas priorizadas (`TrendingMusicsSection`) foi deixada controlável via props para permitir abrir o modal Top 100 a partir da Home.
- Foi adicionado uso de `useTrendingProfiles` para listar dinamicamente Top Artists (fallback quando não há dados reais).

Arquivos alterados
- src/pages/Index.tsx  — novo layout + fallback dinâmico
- src/components/TrendingMusicsSection.tsx — aceita props `externalOpen` e `onExternalOpenChange` para controlar o modal Top 100

Como testar localmente
1) Instalar dependências (se necessário):
   npm install

2) Rodar servidor de desenvolvimento:
   npm run dev

3) Abrir no navegador em:
   http://localhost:8081/

O comportamento esperado
- A Home renderiza as músicas em alta (usa o componente `TrendingMusicsSection` se disponível).
- O bloco "Top Músicas e Artistas" exibe uma lista de faixas (fallback) e uma coluna de Top Artists (dados de `useTrendingProfiles`).
- Ao clicar em "OUVIR TOP MÚSICAS" na Home, o modal Top 100 deve abrir (usando a mesma UI do `TrendingMusicsSection`).

Notas e próximos passos
- Ajustes finos de estilo podem ser necessários para casar exatamente com o mock (cores, espaçamentos, fontes).
- Podemos adicionar testes (Jest/RTL) e checagens de acessibilidade.
- Se quiser, posso continuar com refinamento visual e testes automaticamente.
