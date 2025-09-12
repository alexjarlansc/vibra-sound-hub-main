README: Alterações na Home (Index)

Resumo das mudanças:
- Reestruturada a seção "Top Músicas e Artistas" para duas colunas de 10 músicas cada.
- Adicionado bloco "Álbum em Alta" abaixo das músicas, com botão "OUVIR ÁLBUM".
- Lista de artistas movida para depois do álbum e exibida como mini-cards.
- Mantidos botões CTA: "OUVIR TOP MÚSICAS" e "VER TOP ARTISTAS".
- Adicionados testes de integração para garantir que o modal Top 100 abre corretamente.

Como rodar localmente:
1) Instalar dependências (se necessário):
   cd vibra-sound-hub-main
   npm install

2) Rodar o servidor de desenvolvimento:
   npm run dev

3) Executar apenas os testes:
   npx vitest run

Checklist de QA:
- [ ] Visual: duas colunas aparecem corretamente em desktop.
- [ ] Mobile: listas empilhadas, botões full-width.
- [ ] Interações: ao clicar em OUVIR TOP MÚSICAS o modal é aberto.
- [ ] A11y: botões têm texto/labels adequados para leitura por SR.
- [ ] Tests: vitest executa sem erros (npx vitest run).

Notas:
- Testes usam mocks para evitar dependência de supabase/serviços externos.
- Se quiser um PR automático, forneça permissão para push ou eu posso gerar um patch que você aplica.
