# Plan 1: Provision dedicated `apexgeo-supabase` stack on Velo  (✅ COMPLETE 2026-04-18)

## Verified state (2026-04-18 21:21 SAST)

- **Stack:** 13 containers `Up + (healthy)` under project `apexgeo-supabase` on network `apexgeo_network`
- **Postgres:** 15.8 in `apexgeo-supabase-db`, hosting `apexgeo` database with full Supabase schema set (`auth`, `storage`, `realtime`, `vault`, `extensions`, `graphql`, `pgbouncer`, `public`, `supabase_functions`, `_realtime`)
- **Service bindings:** Auth/Storage/Realtime/REST all on `apexgeo` database via `db:5436/apexgeo`
- **Pooler:** Supavisor accepting `postgres.apexgeo` connections on host port 7783 (txn) and 7784 (session)
- **Internal verification:** `curl -H "apikey: $ANON" http://localhost:7780/auth/v1/health` → `{"version":"v2.186.0","name":"GoTrue",...}` HTTP 200
- **Auth pipeline:** Admin-API user create → Postgres confirm → password sign-in returning JWT → Admin-API delete → confirmed empty (Task 9 end-to-end)
- **External ingress:** `https://api.apexgeo.app/auth/v1/health` → HTTP 200 over TLS 1.3 with valid `apexgeo.app` cert
- **Cloudflare tunnel:** `cloudflared-apexgeo.service` (systemd, runs as `velo`), tunnel `apexgeo` (id `ee07388f-6bf1-4f79-8cfc-969a26f9c9c7`), connected to CPT02 datacenter via QUIC
- **DNS:** `api.apexgeo.app` and `studio.apexgeo.app` proxied CNAMEs to `<tunnel-id>.cfargotunnel.com`
- **Secrets:** `.env` chmod 600 velo:velo at `/home/velo/apexgeo-supabase/.env`; tunnel token in `/etc/systemd/system/cloudflared-apexgeo.service` chmod 600 root

## Connection strings for Plan 2 (apex-app)

```
DATABASE_URL=postgresql://postgres.apexgeo:<POSTGRES_PASSWORD>@apexgeo-supabase-pooler:6543/apexgeo?pgbouncer=true
DIRECT_URL=postgresql://postgres:<POSTGRES_PASSWORD>@apexgeo-supabase-db:5436/apexgeo
NEXT_PUBLIC_SUPABASE_URL=https://api.apexgeo.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from /home/velo/apexgeo-supabase/.env>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from /home/velo/apexgeo-supabase/.env>
SUPABASE_JWT_SECRET=<JWT_SECRET from /home/velo/apexgeo-supabase/.env>
```

When `apex-app` joins the `apexgeo_network` Docker network in Plan 5, it reaches `apexgeo-supabase-pooler` and `apexgeo-supabase-db` by service name (no host ports needed for internal traffic).

---

## Original plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a dedicated, isolated Supabase Docker stack for Apex GEO on the Velo server, with empty `apexgeo` database, fresh secrets, host ports `7780-7786`, and verified internal + external reachability. **No Apex code changes in this plan** — this is pure infrastructure.

**Architecture:** Fork the existing working Supabase stack at `/home/velo/supabase/` into a new directory `/home/velo/apexgeo-supabase/`, rebrand container names, allocate a separate Docker network, generate fresh JWT/Postgres/dashboard secrets, and expose the Kong gateway through the same external ingress mechanism the existing stack uses.

**Tech Stack:** Docker Compose, Supabase self-hosted (Postgres 15.8, Kong 3.9, GoTrue 2.186, Storage 1.48, Realtime 2.76, PostgREST 14.8, Studio 2026.04.08, Supavisor 2.7.4), bash, OpenSSL, psql.

**Reference spec:** `docs/superpowers/specs/2026-04-18-supabase-migration-design.md`

**Domain placeholder:** Throughout this plan, `<domain>` means the public domain you point at Velo (e.g. if your Cloudflare tunnel root is `velocityfibre.co.za`, then `<domain>` is `velocityfibre.co.za` and `api.apex.<domain>` becomes `api.apex.velocityfibre.co.za`). Decide this before Task 10 and substitute consistently.

**Secrets handling:** Throughout this plan, `<POSTGRES_PASSWORD from .env>`, `<SERVICE_ROLE_KEY from .env>`, etc. mean: open `/home/velo/apexgeo-supabase/.env` on Velo, copy the value, paste into the command. Never let secrets pass through Claude Code's tool layer where they'd be logged.

**Executor location:** This plan is written assuming the operator is on a remote machine SSH'ing into Velo (`ssh velo@100.96.203.105 '...'`). If you are running directly on Velo (`hostname=velo-server`), drop the SSH wrapper and run commands locally. As user `hein` (in `docker` and `velo` groups), use `sudo -u velo <cmd>` for filesystem writes under `/home/velo/`; docker commands run directly without sudo.

---

## File / artifact map

All work happens on the Velo server (`100.96.203.105`) over SSH as user `velo`. None of these files live in the Apex repo.

- **Create:** `/home/velo/apexgeo-supabase/docker-compose.yml` — forked from `/home/velo/supabase/docker-compose.yml`
- **Create:** `/home/velo/apexgeo-supabase/.env` — fresh secrets, separate from `/home/velo/supabase/.env`
- **Create:** `/home/velo/apexgeo-supabase/volumes/db/data/` — Postgres data volume (named volume, not bind mount, but path documented)
- **Create:** `/home/velo/apexgeo-supabase/volumes/storage/` — Supabase Storage object data
- **Create:** `/home/velo/apexgeo-supabase/volumes/functions/` — Edge Functions source (unused initially, but directory required by stack)
- **Create:** `/home/velo/apexgeo-supabase/volumes/api/kong.yml` — Kong declarative config
- **Create:** `/home/velo/apexgeo-supabase/volumes/db/init/` — Postgres init scripts
- **Create:** `/home/velo/apexgeo-supabase/volumes/logs/vector.yml` — Vector log shipper config
- **Create:** `/home/velo/apexgeo-supabase/README.md` — operator notes
- **Create:** `/home/velo/apexgeo-supabase/.gitignore` — ignore `.env` and `volumes/`

Secrets file lives outside source control. The `.env` is **not** committed anywhere.

---

## Discovered ingress (recorded by Task 1, 2026-04-18)

Velo uses **Cloudflare Tunnel via systemd services**, one dedicated tunnel per project. No host nginx fronts the internet; nginx runs only as an internal/container service. Public TLS terminates inside Cloudflare's network — tunnels carry plain HTTP from CF edge to local services.

**Active tunnel services** (`/etc/systemd/system/cloudflared-*.service`):
- `cloudflared.service` — generic
- `cloudflared-api.service` → `api.fibreflow.app`
- `cloudflared-bf.service` → Blitz Fibre
- `cloudflared-brighttech.service` → `brighttech.co.za`
- `cloudflared-qfield.service` → FibreFlow QField
- `cloudflared-tunnel.service` → `vf.fibreflow.app`
- `cloudflared-vf.service` → VelocityFibre (`ai@velocityfibre.co.za`)
- `cloudflared-update.service` + `cloudflared-update.timer` → updater
- Plus separate `brighttech-tunnel.service` and `impande-tunnel.service`

**Two configuration styles in use:**
- **Token-based** (e.g. `cloudflared-vf.service`) — systemd `ExecStart=/home/velo/cloudflared tunnel run --token <jwt>`. Ingress hostname routing lives in the Cloudflare Zero Trust dashboard; no local YAML.
- **YAML-config** (e.g. `cloudflared-brighttech.service`) — `--config` flag points at `/home/velo/.cloudflared/{config,api-tunnel-config,brighttech-config}.yml`. Routes versioned locally.

**Network bindings:**
- Host port `:80` bound on `0.0.0.0` (likely ACME/redirect)
- Host port `:443` bound **only** on Tailscale IP `100.96.203.105` — not internet-facing
- Local nginx + Dokploy run as internal services, not edge

**Decision for ApexGEO:** create a dedicated `cloudflared-apexgeo.service` matching the per-project pattern. Style preference is for Task 10 to settle:
- Token-based — matches the dominant pattern on this server, ops live in Cloudflare dashboard, no local YAML drift
- YAML-based — routes git-trackable in `/home/velo/.cloudflared/apexgeo-config.yml`

**Open questions for Task 10** (not blocking Task 1):
1. Which Cloudflare zone hosts ApexGEO? Candidates: `velocityfibre.co.za`, `fibreflow.app`, or a new dedicated domain
2. Token-based vs YAML-based tunnel for ApexGEO
3. Hein creates the tunnel + DNS records via Cloudflare dashboard during Task 10

---

## Task 1: Discover the existing ingress mechanism

**Why:** The spec assumes Cloudflare Tunnel for external access, but `docker ps` shows no `cloudflared` container running. Before configuring routes, find out what's actually fronting the existing `supabase-kong:8300` for the live stack.

**Files:** None modified — discovery only.

- [ ] **Step 1.1: List anything that could be reverse-proxying on Velo**

```bash
ssh velo@100.96.203.105 "docker ps --format '{{.Names}}\t{{.Image}}' | grep -iE 'nginx|caddy|traefik|cloudflared|cloudflare|tunnel|dokploy|haproxy'"
```

Expected: one or more of nginx/caddy/traefik/dokploy. If nothing matches, ingress is via direct host port + DNS A record to Tailscale or public IP.

- [ ] **Step 1.2: Check Velo's public-facing services**

```bash
ssh velo@100.96.203.105 "ss -tlnp | grep -E ':80|:443' ; echo '---' ; sudo iptables -L INPUT -n 2>/dev/null | head -20"
```

Expected: identify what's bound to 80/443 (the public reverse proxy) and what NAT/firewall rules apply.

- [ ] **Step 1.3: Check for cloudflared as a system service**

```bash
ssh velo@100.96.203.105 "systemctl list-units --type=service --state=running 2>/dev/null | grep -iE 'cloud|tunnel|caddy|nginx' ; echo '---DIR---' ; ls /home/velo/cloudflared/ /etc/cloudflared/ 2>/dev/null"
```

Expected: identify whether cloudflared runs as systemd service or container, and where its config lives.

- [ ] **Step 1.4: Document findings in plan**

Append to this plan file under "Discovered ingress" section the exact mechanism found. This drives Task 10. If multiple mechanisms exist (e.g. Dokploy + Cloudflare Tunnel), pick the one used by the existing `supabase-kong:8300`.

**Verification:** You can answer "to make `https://api.apex.<domain>` route to `apexgeo-supabase-kong:8000`, I edit which file/UI/CLI?"

- [ ] **Step 1.5: Commit discovery notes**

```bash
cd /home/hein/Workspace/ApexGEO
git add docs/superpowers/plans/2026-04-18-velo-apexgeo-supabase-stack.md
git commit -m "docs(plan): record discovered Velo ingress mechanism"
```

---

## Task 2: Create directory layout and fork compose template

**Files:**
- Create: `/home/velo/apexgeo-supabase/` (directory tree)
- Create: `/home/velo/apexgeo-supabase/docker-compose.yml` (copy from existing)
- Create: `/home/velo/apexgeo-supabase/.env.template` (copy from existing)

- [ ] **Step 2.1: Create the directory tree on Velo**

```bash
ssh velo@100.96.203.105 'mkdir -p /home/velo/apexgeo-supabase/volumes/{db/data,db/init,storage,functions,api,logs,pooler}'
```

Expected: no output, exit 0.

- [ ] **Step 2.2: Copy existing compose as starting point**

```bash
ssh velo@100.96.203.105 'cp /home/velo/supabase/docker-compose.yml /home/velo/apexgeo-supabase/docker-compose.yml'
```

- [ ] **Step 2.3: Copy existing `.env` as `.env.template` (keys only, not secrets)**

```bash
ssh velo@100.96.203.105 'sed "s/=.*/=/" /home/velo/supabase/.env > /home/velo/apexgeo-supabase/.env.template'
```

This strips the values. Real secrets are generated in Task 3.

- [ ] **Step 2.4: Sanity-check file sizes and shape**

```bash
ssh velo@100.96.203.105 'wc -l /home/velo/apexgeo-supabase/docker-compose.yml /home/velo/apexgeo-supabase/.env.template'
```

Expected: compose ≈ 662 lines, .env.template approximately matches existing `.env` line count.

- [ ] **Step 2.5: Commit nothing yet** — directory contents stay on Velo only. The Apex repo never sees `.env`. We commit the README + plan progress in Task 11.

---

## Task 3: Generate fresh secrets for ApexGEO stack

**Files:**
- Create: `/home/velo/apexgeo-supabase/.env` (real values, not committed anywhere)

These secrets are independent from the existing `/home/velo/supabase/.env` — different JWT secret means a token from one stack will never validate against the other.

- [ ] **Step 3.1: Generate the four required secrets**

```bash
ssh velo@100.96.203.105 'cat <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=" | head -c 40)
DASHBOARD_USERNAME=apexgeo
DASHBOARD_PASSWORD=$(openssl rand -hex 16)
EOF'
```

Expected: 4 lines printed. **Capture this output** — you will paste these into `.env` in Step 3.4. Save them in a password manager / 1Password before proceeding.

- [ ] **Step 3.2: Generate ANON_KEY and SERVICE_ROLE_KEY (HS256 JWTs signed by JWT_SECRET)**

Use Supabase's official keygen helper if present, or hand-roll. First check if helper exists:

```bash
ssh velo@100.96.203.105 'ls /home/velo/supabase/utils/generate-keys.sh 2>/dev/null && echo FOUND || echo MISSING'
```

If `FOUND`, run it with the JWT_SECRET from Step 3.1:

```bash
ssh velo@100.96.203.105 'cd /home/velo/supabase && JWT_SECRET=<paste-from-step-3.1> bash utils/generate-keys.sh'
```

If `MISSING`, generate via node (requires `node` on Velo):

```bash
ssh velo@100.96.203.105 'node -e "
const jwt = require(\"jsonwebtoken\");
const secret = process.env.JWT_SECRET;
const iat = Math.floor(Date.now()/1000);
const exp = iat + 60*60*24*365*5;
console.log(\"ANON_KEY=\" + jwt.sign({role:\"anon\",iss:\"supabase\",iat,exp}, secret));
console.log(\"SERVICE_ROLE_KEY=\" + jwt.sign({role:\"service_role\",iss:\"supabase\",iat,exp}, secret));
"' JWT_SECRET=<paste-from-step-3.1>
```

Expected: 2 long JWT strings prefixed `ANON_KEY=` and `SERVICE_ROLE_KEY=`. Capture both.

- [ ] **Step 3.3: Confirm Vault encryption key**

```bash
ssh velo@100.96.203.105 "openssl rand -base64 32"
```

Expected: 44-char base64 string. This becomes `VAULT_ENC_KEY` in `.env` (Supabase Vault uses it to encrypt secrets at rest in Postgres).

- [ ] **Step 3.4: Write `.env` with all values**

SSH into Velo and create the file (use `nano` or `vi` — do not pipe secrets through Claude Code shell where they'd be logged):

```bash
ssh velo@100.96.203.105
nano /home/velo/apexgeo-supabase/.env
```

Populate using `.env.template` as the key list. The minimum required values (others can stay default from template):

```
# === Secrets generated in Steps 3.1-3.3 ===
POSTGRES_PASSWORD=<from 3.1>
JWT_SECRET=<from 3.1>
ANON_KEY=<from 3.2>
SERVICE_ROLE_KEY=<from 3.2>
DASHBOARD_USERNAME=apexgeo
DASHBOARD_PASSWORD=<from 3.1>
VAULT_ENC_KEY=<from 3.3>
SECRET_KEY_BASE=<openssl rand -base64 64>      # for Realtime
LOGFLARE_PUBLIC_ACCESS_TOKEN=<openssl rand -hex 32>
LOGFLARE_PRIVATE_ACCESS_TOKEN=<openssl rand -hex 32>

# === Project identity ===
STUDIO_DEFAULT_ORGANIZATION=Apex GEO
STUDIO_DEFAULT_PROJECT=ApexGEO
POSTGRES_DB=apexgeo

# === External URL (filled in Task 10 once tunnel exists) ===
SITE_URL=http://localhost:7777
API_EXTERNAL_URL=http://100.96.203.105:7780
SUPABASE_PUBLIC_URL=http://100.96.203.105:7780

# === Ports (host-side) ===
KONG_HTTP_PORT=7780
KONG_HTTPS_PORT=7781
POSTGRES_PORT=7782
POOLER_PROXY_PORT_TRANSACTION=7783
POOLER_PROXY_PORT_SESSION=7784
STUDIO_PORT=7785
ANALYTICS_PORT=7786

# === Auth ===
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true   # dev/staging; flip to false at cutover
JWT_EXPIRY=3600
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=true

# === SMTP (left disabled for now; Task 11 of Plan 3 wires real SMTP) ===
SMTP_ADMIN_EMAIL=hein@h10.co.za
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=Apex GEO

# === Pooler ===
POOLER_TENANT_ID=apexgeo
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=200
POOLER_DB_POOL_SIZE=5

# === Image proxy ===
IMGPROXY_ENABLE_WEBP_DETECTION=true
```

For any key in `.env.template` not listed above, copy the value from `/home/velo/supabase/.env` (these are non-secret defaults like Vector config paths).

- [ ] **Step 3.5: Verify .env is readable only by velo user**

```bash
ssh velo@100.96.203.105 'chmod 600 /home/velo/apexgeo-supabase/.env && ls -l /home/velo/apexgeo-supabase/.env'
```

Expected: `-rw------- 1 velo velo`.

---

## Task 4: Rebrand the compose file (container names, network, ports, volumes)

**Files:**
- Modify: `/home/velo/apexgeo-supabase/docker-compose.yml`

The forked compose still references the existing stack's container names and network. Rebrand everything to `apexgeo-` prefix and create a new dedicated network.

- [ ] **Step 4.1: Rename all container names from `supabase-*` to `apexgeo-supabase-*`**

```bash
ssh velo@100.96.203.105 'sed -i "s/container_name: supabase-/container_name: apexgeo-supabase-/g" /home/velo/apexgeo-supabase/docker-compose.yml'
```

Verify:

```bash
ssh velo@100.96.203.105 'grep "container_name:" /home/velo/apexgeo-supabase/docker-compose.yml'
```

Expected: every line shows `container_name: apexgeo-supabase-<service>`.

- [ ] **Step 4.2: Add a dedicated network at the bottom of the compose file**

```bash
ssh velo@100.96.203.105 'cat >> /home/velo/apexgeo-supabase/docker-compose.yml <<EOF

networks:
  default:
    name: apexgeo_network
    driver: bridge
EOF'
```

This makes every service in the compose join `apexgeo_network` by default, isolated from `supabase_default` (the existing stack's network).

Verify:

```bash
ssh velo@100.96.203.105 'tail -5 /home/velo/apexgeo-supabase/docker-compose.yml'
```

- [ ] **Step 4.3: Confirm port mappings already read from .env**

The upstream Supabase compose uses `${KONG_HTTP_PORT}`, `${POSTGRES_PORT}`, etc. — confirm:

```bash
ssh velo@100.96.203.105 'grep -E "ports:" -A 2 /home/velo/apexgeo-supabase/docker-compose.yml | grep -E "\\\$\{(KONG|POSTGRES|POOLER|STUDIO|ANALYTICS)" | head -20'
```

Expected: see env-var-templated port mappings. If any port is hard-coded (e.g. `"3000:3000"`), edit it to use the corresponding `.env` variable.

- [ ] **Step 4.4: Update volume mount paths to point at `apexgeo-supabase/volumes/`**

The forked compose still references `./volumes/db/data` etc., which will resolve relative to the compose file's directory. Since we copied the file into a new directory, these now correctly point to `/home/velo/apexgeo-supabase/volumes/...`. Verify:

```bash
ssh velo@100.96.203.105 'grep -E "\\./volumes/" /home/velo/apexgeo-supabase/docker-compose.yml | head -10'
```

Expected: relative paths starting `./volumes/`. No changes needed unless any path is absolute.

- [ ] **Step 4.5: Validate compose syntax**

```bash
ssh velo@100.96.203.105 'cd /home/velo/apexgeo-supabase && docker compose --env-file .env config > /tmp/compose-rendered.yml && wc -l /tmp/compose-rendered.yml'
```

Expected: rendered compose is ≥ original line count, no errors. If `docker compose config` errors, fix the YAML and re-run.

---

## Task 5: Pre-populate Postgres init scripts and Kong config

**Files:**
- Modify: `/home/velo/apexgeo-supabase/volumes/db/init/*.sql`
- Modify: `/home/velo/apexgeo-supabase/volumes/api/kong.yml`

Supabase's first boot runs SQL init scripts to create the `auth`, `storage`, `realtime` schemas and populate Vault. These ship in the upstream Supabase repo and are referenced from the compose volumes.

- [ ] **Step 5.1: Copy init scripts from existing stack**

```bash
ssh velo@100.96.203.105 'cp -r /home/velo/supabase/volumes/db/* /home/velo/apexgeo-supabase/volumes/db/'
```

Verify:

```bash
ssh velo@100.96.203.105 'ls /home/velo/apexgeo-supabase/volumes/db/'
```

Expected: directories like `init/`, `realtime.sql`, `webhooks.sql`, `roles.sql`, `jwt.sql`, `_supabase.sql`, `logs.sql`, `pooler.sql`.

- [ ] **Step 5.2: Copy Kong declarative config**

```bash
ssh velo@100.96.203.105 'cp /home/velo/supabase/volumes/api/kong.yml /home/velo/apexgeo-supabase/volumes/api/kong.yml'
```

- [ ] **Step 5.3: Copy Vector config**

```bash
ssh velo@100.96.203.105 'cp /home/velo/supabase/volumes/logs/vector.yml /home/velo/apexgeo-supabase/volumes/logs/vector.yml'
```

- [ ] **Step 5.4: Copy pooler config**

```bash
ssh velo@100.96.203.105 'cp -r /home/velo/supabase/volumes/pooler/* /home/velo/apexgeo-supabase/volumes/pooler/ 2>/dev/null || echo "no pooler config to copy (defaults will be used)"'
```

- [ ] **Step 5.5: Copy functions placeholder**

```bash
ssh velo@100.96.203.105 'cp -r /home/velo/supabase/volumes/functions/* /home/velo/apexgeo-supabase/volumes/functions/ 2>/dev/null || mkdir -p /home/velo/apexgeo-supabase/volumes/functions/main'
```

The functions volume just needs to exist; we are not deploying any edge functions in Plan 1.

---

## Task 6: First boot

**Files:** None modified — invoke the stack.

- [ ] **Step 6.1: Pull all images first (avoids tangled errors during up)**

```bash
ssh velo@100.96.203.105 'cd /home/velo/apexgeo-supabase && docker compose --env-file .env pull'
```

Expected: each image either pulls or reports "Image is up to date" (most are already on the host from the existing stack).

- [ ] **Step 6.2: Bring the stack up in detached mode**

```bash
ssh velo@100.96.203.105 'cd /home/velo/apexgeo-supabase && docker compose --env-file .env up -d'
```

Expected: every service reports `Container apexgeo-supabase-<name>  Started` or `Healthy`. No `Error` or `Exited`.

- [ ] **Step 6.3: Wait 30 seconds for healthchecks**

```bash
sleep 30
```

- [ ] **Step 6.4: Verify all containers are running and healthy**

```bash
ssh velo@100.96.203.105 'docker compose -p apexgeo-supabase --env-file /home/velo/apexgeo-supabase/.env -f /home/velo/apexgeo-supabase/docker-compose.yml ps'
```

Expected: ~14 containers, all `Up`, healthchecks `(healthy)` for `apexgeo-supabase-db`, `apexgeo-supabase-kong`, `apexgeo-supabase-storage`, `apexgeo-supabase-imgproxy`, `apexgeo-supabase-vector`, `apexgeo-supabase-analytics`, `apexgeo-supabase-realtime`, `apexgeo-supabase-meta`, `apexgeo-supabase-studio`, `apexgeo-supabase-pooler`. Auth and rest may show `Up` without explicit healthcheck (that's OK — verified by curl in Task 7).

If any container is `Restarting`, check its logs:

```bash
ssh velo@100.96.203.105 'docker logs apexgeo-supabase-<name> --tail 50'
```

Common first-boot issues: `JWT_SECRET` mismatch (recheck `.env`), port already bound (another stack on same port — verify Task 4.3), volume permission denied (re-run `chown -R 1000:1000 volumes/`).

---

## Task 7: Verify internal connectivity

**Files:** None modified — read-only checks.

- [ ] **Step 7.1: Postgres on host port 7782**

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<POSTGRES_PASSWORD from .env> psql -h localhost -p 7782 -U postgres -d postgres -c "SELECT version();"'
```

Expected: `PostgreSQL 15.8` line returned.

- [ ] **Step 7.2: Schemas exist (auth, storage, realtime, vault present) — in `apexgeo` database**

Since `POSTGRES_DB=apexgeo` was set in `.env`, Supabase's init scripts run against `apexgeo`, not the default `postgres` database. Check `apexgeo` first:

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -d apexgeo -c "\\dn"'
```

Expected: schemas `auth`, `extensions`, `graphql`, `pgsodium`, `realtime`, `storage`, `vault`, `public` listed.

If `apexgeo` is missing Supabase schemas but `postgres` has them, the init scripts ran against the wrong database. Fix: edit init script paths or re-init. Capture the state before fixing:

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -d postgres -c "\\dn"'
```

- [ ] **Step 7.3: `apexgeo` database exists (created automatically from `POSTGRES_DB` env)**

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -c "\\l" | grep apexgeo'
```

Expected: row showing `apexgeo` database with owner `postgres`.

If missing, create manually:

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -c "CREATE DATABASE apexgeo;"'
```

- [ ] **Step 7.4: Kong gateway responds on host port 7780**

```bash
ssh velo@100.96.203.105 'curl -sf http://localhost:7780/auth/v1/health | head -c 200'
```

Expected: JSON response with `version`, `name`, `description` fields. HTTP 200.

If 404, Kong's `kong.yml` may not have been copied — recheck Step 5.2.

- [ ] **Step 7.5: Studio responds on host port 7785**

```bash
ssh velo@100.96.203.105 'curl -sf -o /dev/null -w "%{http_code}\\n" http://localhost:7785/'
```

Expected: HTTP 200 or 307 (redirect to dashboard).

- [ ] **Step 7.6: Pooler accepts connections on host port 7783 (transaction mode)**

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7783 -U "postgres.apexgeo" -d apexgeo -c "SELECT 1;"'
```

The pooler username format is `<role>.<tenant_id>` — `postgres.apexgeo` per the `POOLER_TENANT_ID=apexgeo` set in `.env`.

Expected: `?column?` row returning `1`.

If "tenant not found" error, verify `POOLER_TENANT_ID=apexgeo` was set, then restart pooler:

```bash
ssh velo@100.96.203.105 'docker restart apexgeo-supabase-pooler'
```

---

## Task 8: Bind Auth/Storage/Realtime to the `apexgeo` database

**Files:** Modify: `/home/velo/apexgeo-supabase/.env`

By default the upstream compose binds Auth/Storage/Realtime to the `postgres` database. We need them on `apexgeo` so Apex's data lives in its own logical database.

- [ ] **Step 8.1: Confirm current binding (likely `postgres`)**

```bash
ssh velo@100.96.203.105 'docker exec apexgeo-supabase-auth env | grep DB_DATABASE'
```

Expected: `GOTRUE_DB_DATABASE_URL=postgres://...:5432/postgres` or similar.

- [ ] **Step 8.2: Append `POSTGRES_DB=apexgeo` if not already in `.env`**

```bash
ssh velo@100.96.203.105 'grep "^POSTGRES_DB=" /home/velo/apexgeo-supabase/.env || echo "POSTGRES_DB=apexgeo" >> /home/velo/apexgeo-supabase/.env'
```

- [ ] **Step 8.3: Verify the compose file uses `POSTGRES_DB` for Auth/Storage/Realtime DB URLs**

```bash
ssh velo@100.96.203.105 'grep -E "DATABASE_URL|DB_DATABASE_URL|DB_NAME" /home/velo/apexgeo-supabase/docker-compose.yml'
```

Expected: lines like `GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}` (uses the env var).

If any URL is hard-coded to `/postgres`, edit it to `/${POSTGRES_DB}` and recreate the relevant service.

- [ ] **Step 8.4: Recreate Auth, Storage, Realtime to pick up the env change**

```bash
ssh velo@100.96.203.105 'cd /home/velo/apexgeo-supabase && docker compose --env-file .env up -d --force-recreate auth storage realtime rest'
```

- [ ] **Step 8.5: Verify Auth now binds to `apexgeo`**

```bash
ssh velo@100.96.203.105 'docker exec apexgeo-supabase-auth env | grep DB_DATABASE_URL'
```

Expected: URL ends in `/apexgeo`.

- [ ] **Step 8.6: Verify Auth created its tables in `apexgeo.auth.*`**

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -d apexgeo -c "\\dt auth.*"'
```

Expected: tables `auth.users`, `auth.identities`, `auth.sessions`, `auth.refresh_tokens`, etc.

If schema is empty, Auth may have failed to migrate. Check:

```bash
ssh velo@100.96.203.105 'docker logs apexgeo-supabase-auth --tail 100'
```

---

## Task 9: Smoke test the Auth Admin API end-to-end

**Files:** None — runtime check.

- [ ] **Step 9.1: Create a throwaway test user via the Admin API**

```bash
ssh velo@100.96.203.105 'curl -sX POST http://localhost:7780/auth/v1/admin/users \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY from .env>" \
  -H "apikey: <SERVICE_ROLE_KEY from .env>" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"smoketest@apex.local\",\"password\":\"hunter2hunter2\",\"email_confirm\":true}"'
```

Expected: JSON with `id` (uuid), `email`, `created_at`, etc. HTTP 200.

- [ ] **Step 9.2: Verify the user appears in Postgres**

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -d apexgeo -c "SELECT id, email, created_at FROM auth.users WHERE email='\''smoketest@apex.local'\'';"'
```

Expected: one row with the uuid from Step 9.1.

- [ ] **Step 9.3: Sign in with that user and get a JWT**

```bash
ssh velo@100.96.203.105 'curl -sX POST http://localhost:7780/auth/v1/token?grant_type=password \
  -H "apikey: <ANON_KEY from .env>" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"smoketest@apex.local\",\"password\":\"hunter2hunter2\"}"'
```

Expected: JSON with `access_token` (JWT), `refresh_token`, `expires_in: 3600`, `user: {...}`.

- [ ] **Step 9.4: Delete the test user (cleanup)**

```bash
ssh velo@100.96.203.105 'curl -sX DELETE http://localhost:7780/auth/v1/admin/users/<uuid from 9.1> \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" -H "apikey: <SERVICE_ROLE_KEY>"'
```

Expected: HTTP 200, empty body. Verify removal:

```bash
ssh velo@100.96.203.105 'PGPASSWORD=<pw> psql -h localhost -p 7782 -U postgres -d apexgeo -c "SELECT count(*) FROM auth.users WHERE email='\''smoketest@apex.local'\'';"'
```

Expected: `count: 0`.

---

## Task 10: Wire external ingress

**Files:** Depends on the ingress mechanism discovered in Task 1. Examples:
- If Cloudflare Tunnel: `/home/velo/cloudflared/config.yml` (or wherever it lives) + Cloudflare DNS
- If nginx reverse proxy: `/etc/nginx/sites-available/api.apex.<domain>` + reload
- If Dokploy: a new service definition in the Dokploy UI
- If Caddy: `/etc/caddy/Caddyfile` entry

Use whatever Task 1 identified.

- [ ] **Step 10.1: Add a route mapping `api.apex.<domain>` → `apexgeo-supabase-kong:8000`**

Concrete example for Cloudflare Tunnel (adjust if Task 1 found something else):

```yaml
# /home/velo/cloudflared/config.yml — add to ingress: list
- hostname: api.apex.<domain>
  service: http://apexgeo-supabase-kong:8000
- hostname: studio.apex.<domain>
  service: http://apexgeo-supabase-studio:3000
```

For nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name api.apex.<domain>;
    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    location / {
        proxy_pass http://172.17.0.1:7780;   # host-mapped port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- [ ] **Step 10.2: Reload the ingress service**

For cloudflared (container): `docker restart cloudflared` or `systemctl restart cloudflared`.
For nginx: `sudo nginx -t && sudo systemctl reload nginx`.

- [ ] **Step 10.3: Add Cloudflare DNS records (if Cloudflare Tunnel)**

In Cloudflare DNS: add CNAME `api.apex` → `<tunnel-id>.cfargotunnel.com` (proxied).
Same for `studio.apex` if exposing Studio.

If using nginx + Let's Encrypt, ensure DNS A record points at Velo's public IP and certbot has a cert.

- [ ] **Step 10.4: Verify external reachability from a non-Velo machine**

From your local laptop (not SSH'd into Velo):

```bash
curl -sf https://api.apex.<domain>/auth/v1/health | head -c 200
```

Expected: same JSON `version`/`name` response as Step 7.4. HTTP 200, valid TLS.

- [ ] **Step 10.5: Update `.env` with the real public URL**

```bash
ssh velo@100.96.203.105 'sed -i "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://api.apex.<domain>|" /home/velo/apexgeo-supabase/.env'
ssh velo@100.96.203.105 'sed -i "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://api.apex.<domain>|" /home/velo/apexgeo-supabase/.env'
```

- [ ] **Step 10.6: Recreate Kong + Studio + Auth so they pick up the new external URL**

```bash
ssh velo@100.96.203.105 'cd /home/velo/apexgeo-supabase && docker compose --env-file .env up -d --force-recreate kong studio auth'
```

- [ ] **Step 10.7: Re-run the external smoke test**

```bash
curl -sf https://api.apex.<domain>/auth/v1/health
```

Expected: JSON 200, with the same response as Step 10.4.

---

## Task 11: Document and finalize

**Files:**
- Create: `/home/velo/apexgeo-supabase/README.md`
- Modify: `docs/superpowers/plans/2026-04-18-velo-apexgeo-supabase-stack.md` (mark complete)

- [ ] **Step 11.1: Write operator README on Velo**

```bash
ssh velo@100.96.203.105 'cat > /home/velo/apexgeo-supabase/README.md <<EOF
# ApexGEO Supabase Stack

Dedicated self-hosted Supabase for the Apex GEO project.
Forked from /home/velo/supabase on 2026-04-18.

## Endpoints
- Postgres direct:    localhost:7782 (db: apexgeo)
- Postgres pooler:    localhost:7783 (transaction), localhost:7784 (session)
- Kong (REST/Auth/Storage/Realtime): localhost:7780 → https://api.apex.<domain>
- Studio:             localhost:7785 → https://studio.apex.<domain> (behind Cloudflare Access)
- Analytics:          localhost:7786

## Containers
- apexgeo-supabase-{db,kong,auth,storage,realtime,rest,studio,meta,pooler,vector,analytics,imgproxy,edge-functions,vector}

## Network
- apexgeo_network (bridge) — Apex app + worker join this network

## Secrets
- /home/velo/apexgeo-supabase/.env (chmod 600, never committed)
- Backups: 1Password vault "Apex GEO infra"

## Common ops
- Status:           docker compose ps
- Logs:             docker compose logs -f <service>
- Restart one:      docker compose up -d --force-recreate <service>
- Stop all:         docker compose down
- Start all:        docker compose up -d
- Backup db:        pg_dump -h localhost -p 7782 -U postgres apexgeo > backup.sql

## Reference
- Spec: /home/hein/Workspace/ApexGEO/docs/superpowers/specs/2026-04-18-supabase-migration-design.md
- Plan: /home/hein/Workspace/ApexGEO/docs/superpowers/plans/2026-04-18-velo-apexgeo-supabase-stack.md
EOF'
```

- [ ] **Step 11.2: Add a `.gitignore` so accidental `git init` here can't leak secrets**

```bash
ssh velo@100.96.203.105 'cat > /home/velo/apexgeo-supabase/.gitignore <<EOF
.env
volumes/db/data/
volumes/storage/
*.dump
*.sql.gz
EOF'
```

- [ ] **Step 11.3: Mark plan complete in Apex repo**

Edit `docs/superpowers/plans/2026-04-18-velo-apexgeo-supabase-stack.md` — change the title line to `# Plan 1: Provision dedicated apexgeo-supabase stack on Velo (✅ COMPLETE)` and append a "Verified state" section listing:
- Stack health (output of `docker compose ps` summary)
- External URL (`https://api.apex.<domain>`)
- Studio URL (`https://studio.apex.<domain>`)
- Connection string template for Plan 2: `postgresql://postgres:<pw>@apexgeo-supabase-pooler:6543/apexgeo?pgbouncer=true`

- [ ] **Step 11.4: Commit final plan state**

```bash
cd /home/hein/Workspace/ApexGEO
git add docs/superpowers/plans/2026-04-18-velo-apexgeo-supabase-stack.md
git commit -m "$(cat <<'EOF'
infra(supabase): provision dedicated apexgeo-supabase stack on Velo

Plan 1 of 6 in the Velo+Supabase migration. Forks the existing
Supabase stack into /home/velo/apexgeo-supabase with isolated
network, fresh JWT secrets, ports 7780-7786, apexgeo database.

Verified: stack healthy, Auth/Postgres/Kong reachable internally
and externally via api.apex.<domain> tunnel.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Verification checklist (run before declaring Plan 1 complete)

All of the following must return success. If any fail, do not proceed to Plan 2.

- [ ] `docker compose ps` shows all 14 ApexGEO containers `Up` and `(healthy)` where applicable
- [ ] `psql -h localhost -p 7782 -U postgres -d apexgeo -c "\dn"` lists `auth`, `storage`, `realtime`, `vault`, `extensions`, `graphql`, `public`
- [ ] `curl http://localhost:7780/auth/v1/health` returns HTTP 200 with version JSON
- [ ] Auth Admin API can create + sign in + delete a test user (Task 9)
- [ ] `curl https://api.apex.<domain>/auth/v1/health` returns HTTP 200 from outside Velo
- [ ] Studio loads at `https://studio.apex.<domain>` and accepts dashboard credentials
- [ ] `apexgeo` database has `auth.users` table populated with 0 rows (clean slate)
- [ ] No port collisions with existing Velo services (`docker port` on each container shows expected 7780-7786)
- [ ] `.env` is `chmod 600` and not in any git repo
- [ ] Plan file marked complete and committed

---

## What's NOT in this plan (saved for follow-on plans)

- **Plan 2:** Database driver swap in Apex codebase (`@neondatabase/serverless` → `pg`)
- **Plan 3:** Auth swap (`@clerk/nextjs` → `@supabase/ssr`)
- **Plan 4:** Cache + Storage swaps (Upstash → ioredis, local uploads → Supabase Storage)
- **Plan 5:** Apex containerization for Velo (`apex-app` + `apex-worker` Dockerfiles, compose, env)
- **Plan 6:** Production cutover runbook (data migration, DNS flip, decommission)

Each follow-on plan starts only after the prior plan's verification checklist passes.
