# Configuração Incremental do Supabase

Este diretório contém apenas as alterações **novas** necessárias para alinhar o banco Supabase existente à nova versão do painel web (`aplicativo/`).

## 1. O que já existe no projeto original (inferido do código)
- Tabela `public.movimentacoes` com as colunas `id`, `dispositivo_id`, `tipo`, `quantidade` e `criado_em`.
- RLS ativo com permissão de `INSERT` para `anon` (usada diretamente pelo firmware `catraca_virtual_esp32.ino`).
- Publicação `supabase_realtime` habilitada para `public.movimentacoes`.

## 2. O que executar agora (Migration SQL)
Execute o conteúdo de [`migrations/001_evolucao_painel.sql`](migrations/001_evolucao_painel.sql) no **SQL Editor** do Supabase:
- Adiciona a coluna opcional `identificacao` (`text`, `NULL` por padrão, sem quebrar os inserts do ESP32).
- Cria índices em `criado_em` e `(tipo, criado_em)` para otimizar o **Histórico** e as **Métricas**.
- Garante política `SELECT` para a role `authenticated`, mantendo `anon` sem permissão de leitura.

## 3. Configuração de Autenticação (Supabase Auth)
Não é necessário criar tabela de usuários por SQL — o painel utiliza o **Supabase Auth** nativo (`auth.users`):
1. No painel do Supabase, acesse **Authentication → Providers → Email** e confirme que **Email** está habilitado.
2. Acesse **Authentication → Users → Add user** e cadastre o e-mail e senha dos operadores que terão acesso ao painel.

## 4. Variáveis de ambiente do frontend (`aplicativo/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ESP32_API_TOKEN`
