Como aplicar a migração `track_likes`

Esse projeto supõe que existe a tabela `track_likes`. Se você recebeu o erro "Could not find the table public.track_likes in the schema cache", aplique a migração abaixo no seu projeto Supabase.

1) Pelo painel SQL do Supabase:
- Abra seu projeto no supabase.com
- Navegue em "SQL" > "New query"
- Cole o conteúdo de `supabase/migrations/202509041700_track_likes.sql` e execute.

2) Pelo supabase CLI:
- Instale/Configure o supabase CLI (https://supabase.com/docs/guides/cli)
- Rode:
  supabase db remote set <CONNECTION_STRING>
  psql <CONNECTION_STRING> -f supabase/migrations/202509041700_track_likes.sql

O que a migração cria:
- Tabela `public.track_likes (id, track_id, user_id, created_at)`
- Políticas RLS:
  - Inserir apenas usuários autenticados com `user_id = auth.uid()`
  - Deletar apenas o próprio like
  - Select público (para contagem de likes)
- Índice em `track_id` para performance

Depois de aplicar, recarregue a página e tente curtir novamente.

Se quiser, posso aplicar a migração para você se me fornecer acesso (ou instruções para usar um CLI remoto).

Como rodar a migração localmente (PowerShell)
-------------------------------------------

1) Usando a variável de ambiente SUPABASE_DB_URL (recomendado):

```powershell
# No PowerShell, defina a variável e execute o script
$env:SUPABASE_DB_URL = "postgres://user:password@host:5432/database"
.\\
\scripts\apply_track_likes_migration.ps1
```

2) Passando a connection string como parâmetro:

```powershell
.\scripts\apply_track_likes_migration.ps1 -ConnectionString "postgres://user:password@host:5432/database"
```

Observações:
- O script usa `psql` por baixo dos panos. No Windows, instale o cliente oficial do PostgreSQL ou use o psql do WSL.
- Se preferir, abra o arquivo `supabase/migrations/202509041700_track_likes.sql` e cole o SQL no editor SQL do painel do Supabase.

Verificações pós-migração (rápidas)
---------------------------------

Após aplicar a migração, confirme que a tabela foi criada e que as políticas estão no lugar.

1) Verificar existência da tabela (psql):

```powershell
psql "$env:SUPABASE_DB_URL" -c "\dt public.track_likes"
```

Deve aparecer a tabela `public.track_likes` listada. Se não aparecer, verifique mensagens de erro do psql.

2) Verificar colunas e índice:

```powershell
psql "$env:SUPABASE_DB_URL" -c "\d+ public.track_likes"
```

3) Teste rápido: inserir um like (substitua USER_ID e TRACK_ID)

```powershell
psql "$env:SUPABASE_DB_URL" -c "INSERT INTO public.track_likes (track_id, user_id) VALUES ('TRACK_ID', 'USER_ID');"
```

4) Teste via app: reinicie o servidor de dev e tente curtir novamente a partir da UI. Verifique o console do navegador e os logs do servidor para erros.

Se quiser, eu posso também gerar um script opcional para checar RLS e políticas automaticamente (psql queries que listam policies).