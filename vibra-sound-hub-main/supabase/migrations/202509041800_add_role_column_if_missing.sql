-- Adiciona coluna role se não existir e função bootstrap_admin segura
DO $$
BEGIN
  -- Verifica se coluna role existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    -- Preenche nulos com 'user'
    UPDATE public.profiles SET role='user' WHERE role IS NULL;
  END IF;
END$$;

-- Função para promover primeiro usuário a admin caso não exista nenhum admin
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  existing_admin uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  SELECT id INTO existing_admin FROM public.profiles WHERE role='admin' LIMIT 1;
  IF existing_admin IS NULL THEN
    UPDATE public.profiles SET role='admin' WHERE id = auth.uid();
    RETURN 'promoted';
  ELSE
    RETURN 'admin_already_exists';
  END IF;
END;$$;
