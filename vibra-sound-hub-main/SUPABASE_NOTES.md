Top Músicas - Integração com Supabase

O componente `TopMusicTemplate` foi alterado para buscar os dados reais usando os hooks:
- `useTrendingTracks` (para faixas)
- `useTrendingProfiles` (para artistas/perfis)

Como o player precisa de uma URL para tocar cada faixa, o template usa atualmente um placeholder:

  url: `/api/stream/${t.id}`

Você precisa escolher como servir os arquivos de áudio:

Opções recomendadas:

1) Supabase Storage (público)
- Salve os arquivos no bucket `tracks` (ou similar).
- Gere URLs públicas usando supabase.storage.from('tracks').getPublicUrl(path)
- Atualize o hook `useTrendingTracks` para incluir o campo com o caminho/URL do arquivo (ex: `file_path` ou `file_url`).
- No `TopMusicTemplate`, mapeie `url` para esse valor.

2) URLs assinadas (privadas)
- Use supabase.storage.from('tracks').createSignedUrl(path, segundos)
- Crie um endpoint serverless (ex: `/api/stream/:id`) que troca `id` por path no storage, gera a signed url e redireciona ou retorna a URL.
- Esse endpoint deve validar permissões se necessário.

3) Servir via CDN/externo
- Se os arquivos estiverem em outro host, adicione o campo `stream_url` nas views/tabelas e exponha diretamente ao front.

Notas adicionais:
- O `TopMusicTemplate` chama `player.playQueue(...)` com as faixas mapeadas. O formato esperado pelo player é:
  { id, title, artist?, url, albumId?, coverUrl? }

- Se quiser, eu posso:
  - Atualizar `useTrendingTracks` para selecionar também o campo `file_path`/`file_url` do Supabase.
  - Implementar um endpoint `/api/stream/:id` que retorna uma signed URL para o arquivo.
  - Ou mapear diretamente public URLs no frontend.

Diga qual opção prefere e eu implemento os ajustes necessários.
