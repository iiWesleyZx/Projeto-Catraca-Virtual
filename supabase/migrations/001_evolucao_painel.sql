-- ============================================================================
-- MIGRATION INCREMENTAL: Evolução do Painel Catraca Virtual ESP32
-- ============================================================================
-- O que JÁ existe no banco (não recriado aqui):
--   - Tabela public.movimentacoes (id, dispositivo_id, tipo, quantidade, criado_em)
--   - Política de INSERT para role anon (usada pelo ESP32)
--   - Publicação Realtime em public.movimentacoes
--
-- Esta migration é idempotente e adiciona apenas o que é novo para o painel.
-- ============================================================================

-- 1. Coluna opcional para identificação individual (ex.: futuro uso de RFID/biometria)
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS identificacao text;

-- 2. Índices para acelerar consultas de histórico e agregações de métricas
CREATE INDEX IF NOT EXISTS idx_movimentacoes_criado_em
  ON public.movimentacoes (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo_criado_em
  ON public.movimentacoes (tipo, criado_em DESC);

-- 3. Política de leitura para usuários autenticados via Supabase Auth
-- (Mantém anon sem permissão SELECT, preservando a restrição original do ESP32)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'movimentacoes'
      AND policyname = 'Permitir leitura para usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir leitura para usuarios autenticados"
      ON public.movimentacoes
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;
