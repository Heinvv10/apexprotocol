# Local Development — full Apex stack

Bring the whole stack up locally: Supabase + Langfuse + LiteLLM + Loki + Grafana.

## One-time setup

```bash
# 1. Clone Supabase self-host repo (outside this repo)
sudo mkdir -p /opt/supabase && cd /opt/supabase
sudo git clone --depth 1 https://github.com/supabase/supabase.git
cd supabase/docker

# 2. Generate secrets for both stacks
cat > .env.apex <<'EOF'
LITELLM_MASTER_KEY=sk-$(openssl rand -hex 32)
LANGFUSE_SALT=$(openssl rand -hex 32)
LANGFUSE_ENCRYPTION_KEY=$(openssl rand -hex 32)
LANGFUSE_NEXTAUTH_SECRET=$(openssl rand -hex 32)
LANGFUSE_NEXTAUTH_URL=http://localhost:3002
LANGFUSE_MINIO_PASSWORD=$(openssl rand -hex 24)
LANGFUSE_CLICKHOUSE_PASSWORD=$(openssl rand -hex 24)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -hex 24)

# Provider API keys — fill in your own
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
PERPLEXITY_API_KEY=
XAI_API_KEY=
DEEPSEEK_API_KEY=
EOF
echo "Secrets generated in /opt/supabase/supabase/docker/.env.apex"
echo "Copy these into your password manager and the main .env"

# 3. Copy Supabase's own default .env
cp .env.example .env

# 4. First run — start Supabase, then extension stack
docker compose up -d
docker compose -f /home/hein/Workspace/ApexGEO/docker-compose.supabase.yml --env-file .env --env-file .env.apex up -d
```

## Everyday commands

```bash
cd /opt/supabase/supabase/docker

# Up
docker compose up -d
docker compose -f /home/hein/Workspace/ApexGEO/docker-compose.supabase.yml --env-file .env --env-file .env.apex up -d

# Down
docker compose -f /home/hein/Workspace/ApexGEO/docker-compose.supabase.yml down
docker compose down

# Status
docker compose ps
docker compose -f /home/hein/Workspace/ApexGEO/docker-compose.supabase.yml ps

# Logs
docker compose logs -f langfuse-web
docker compose logs -f litellm
```

## Internal URLs (SSH-tunnel from workstation)

```bash
ssh -L 3001:localhost:3001 \          # Supabase Studio
    -L 3002:localhost:3002 \          # Langfuse web
    -L 3003:localhost:3003 \          # Grafana
    -L 4000:localhost:4000 \          # LiteLLM proxy
    -L 8000:localhost:8000 \          # Supabase Kong gateway
    project-server
```

Then in the browser:
- http://localhost:3001 — Supabase Studio
- http://localhost:3002 — Langfuse (first-run sign-up is open, lock down with `LANGFUSE_INIT_*` env vars)
- http://localhost:3003 — Grafana (admin / `$GRAFANA_ADMIN_PASSWORD`)
- http://localhost:4000 — LiteLLM health: `curl http://localhost:4000/health/liveliness`

## Wiring the app to these services

Add to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://api.apex.dev           # prod
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000        # dev
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Studio settings>
SUPABASE_SERVICE_ROLE_KEY=<from Studio settings>
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/postgres

# Langfuse
LANGFUSE_HOST=http://localhost:3002
LANGFUSE_PUBLIC_KEY=<from Langfuse settings>
LANGFUSE_SECRET_KEY=<from Langfuse settings>

# LiteLLM
LITELLM_BASE_URL=http://localhost:4000/v1
LITELLM_API_KEY=<master key from .env.apex>
LITELLM_ENABLED=true
```

## Smoke-test the stack

```bash
# Supabase
curl -H "apikey: $SUPABASE_ANON_KEY" http://localhost:8000/rest/v1/

# LiteLLM — list models
curl -H "Authorization: Bearer $LITELLM_API_KEY" http://localhost:4000/models

# LiteLLM — chat
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-haiku-4-5", "messages": [{"role":"user","content":"ping"}]}'

# Langfuse — check trace landed
# Browse to http://localhost:3002 → Traces → should see the chat call above
```

## Teardown (destructive — wipes all data)

```bash
docker compose -f /home/hein/Workspace/ApexGEO/docker-compose.supabase.yml down -v
docker compose down -v
```

## Troubleshooting

- **LiteLLM can't connect to DB** — check `LITELLM_DATABASE_URL` or ensure `db` container is healthy first
- **Langfuse ClickHouse migrations fail** — restart `langfuse-worker` after ClickHouse is healthy
- **Kong gateway 503** — verify all underlying Supabase services (auth/rest/realtime/storage) are healthy
- **Out of disk** — ClickHouse + Langfuse S3 (MinIO) can grow fast in high-volume dev. Prune with `docker volume rm`
