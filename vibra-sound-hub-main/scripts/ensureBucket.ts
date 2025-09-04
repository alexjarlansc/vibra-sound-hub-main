/**
 * Script para garantir existência do bucket de músicas no Supabase.
 * Pode ser rodado localmente: `npx tsx scripts/ensureBucket.ts` (instale tsx se quiser) ou `ts-node`.
 * Requer variáveis:
 *  - VITE_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY (necessária para criar bucket). NÃO comitar.
 *  - VITE_SUPABASE_MUSIC_BUCKET (opcional, default 'music')
 *
 * Se não houver service role, o script apenas checa e avisa.
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // não usar a anon pública para criar bucket
const bucketName = process.env.VITE_SUPABASE_MUSIC_BUCKET || 'music'

if (!url) {
  console.error('VITE_SUPABASE_URL não definida')
  process.exit(1)
}

async function main() {
  if (!serviceKey) {
    console.log('SUPABASE_SERVICE_ROLE_KEY não definida. Apenas checando bucket com anon key...')
  }
  const key = serviceKey || process.env.VITE_SUPABASE_ANON_KEY
  if (!key) {
    console.error('Nenhuma key (service ou anon) encontrada nas variáveis. Abortando.')
    process.exit(1)
  }

  const supabase = createClient(url as string, key as string, { auth: { persistSession: false } })

  // 1. Listar buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('Erro listando buckets:', listError.message)
  } else {
    const exists = buckets?.some(b => b.name === bucketName)
    if (exists) {
      console.log(`Bucket '${bucketName}' já existe.`)
    } else if (!serviceKey) {
      console.log(`Bucket '${bucketName}' NÃO existe e não há service key para criá-lo.`)
      console.log('Crie manualmente no dashboard: Storage > Create bucket > Name: ' + bucketName + ' (Public).')
      process.exit(0)
    } else {
      console.log(`Bucket '${bucketName}' não encontrado. Criando...`)
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 100, // 100MB por arquivo (ajuste se quiser)
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'image/png', 'image/jpeg', 'image/webp']
      })
      if (createError) {
        console.error('Falha ao criar bucket:', createError.message)
        process.exit(1)
      }
      console.log('Bucket criado com sucesso.')
    }
  }

  // 2. Garantir política pública (se service key)
  if (serviceKey) {
    console.log('Verifique no painel as Regras de Storage: leitura pública deve estar habilitada se quiser servir arquivos diretamente.')
  } else {
    console.log('Sem service key: não foi possível ajustar políticas automaticamente.')
  }

  console.log('Done.')
}

main().catch(e => {
  console.error('Erro inesperado:', e)
  process.exit(1)
})
