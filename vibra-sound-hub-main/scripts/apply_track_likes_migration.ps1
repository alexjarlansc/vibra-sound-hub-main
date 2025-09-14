<#
Aplicar migração `track_likes` no Supabase/Postgres via psql.
Uso:
  - Defina a variável de ambiente SUPABASE_DB_URL ou passe como parâmetro:
    ./scripts/apply_track_likes_migration.ps1 -ConnectionString "postgres://..."

Observações:
  - Requer o cliente psql instalado e no PATH.
  - O arquivo SQL da migração deve existir em supabase/migrations/202509041700_track_likes.sql
#>
param(
    [string]$ConnectionString = $env:SUPABASE_DB_URL
)

function Abort([string]$msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

if (-not $ConnectionString) {
    $ConnectionString = Read-Host "Informe a connection string do Postgres/Supabase (ex: postgres://user:pass@host:5432/db)"
}

if (-not $ConnectionString) {
    Abort "Nenhuma connection string informada. Saindo."
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Abort "psql não encontrado. Instale o cliente PostgreSQL e garanta que 'psql' esteja no PATH. Veja https://www.postgresql.org/download/"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$sqlPath = Resolve-Path (Join-Path $scriptDir "..\supabase\migrations\202509041700_track_likes.sql") -ErrorAction SilentlyContinue
if (-not $sqlPath) {
    Abort "Arquivo de migração não encontrado em supabase/migrations/202509041700_track_likes.sql"
}

Write-Host "Aplicando migração: $($sqlPath)" -ForegroundColor Cyan

try {
    & psql $ConnectionString -f $sqlPath
    if ($LASTEXITCODE -ne 0) {
        Abort "psql retornou código de saída $LASTEXITCODE"
    }
} catch {
    Abort "Falha ao executar psql: $($_.Exception.Message)"
}

Write-Host "Migração aplicada com sucesso." -ForegroundColor Green
