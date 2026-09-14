-- Migração: Adicionar coluna status na tabela interessados
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Adicionar coluna status com valores permitidos
ALTER TABLE interessados 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'novo' 
CHECK (status IN ('novo', 'contatado', 'convertido', 'perdido'));

-- 2. Criar índice para performance em filtros por status
CREATE INDEX IF NOT EXISTS idx_interessados_status 
ON interessados(status);

-- 3. Índice composto para ordenação por data + status
CREATE INDEX IF NOT EXISTS idx_interessados_data_status 
ON interessados(data_envio DESC, status);

-- 4. Comentário na coluna
COMMENT ON COLUMN interessados.status IS 'Status do lead: novo, contactado, convertido, perdido';

-- 5. (Opcional) Atualizar leads existentes para 'novo'
UPDATE interessados SET status = 'novo' WHERE status IS NULL;

-- Verificar migração
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'interessados'
ORDER BY ordinal_position;