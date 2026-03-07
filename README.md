# HubFutebol MVP

MVP mobile-first para microcampeonatos de pelada (grupos fechados), com frontend em Next.js e backend em FastAPI.

## Estado atual (local)

- Frontend online em `http://127.0.0.1:3000`
- API online em `http://127.0.0.1:8000`
- Healthcheck: `GET /health`
- Seed demo gerada para teste

### Credenciais demo

- Email: `demo@hubfutebol.dev`
- Senha: `123456`
- Codigo de convite: `demo123`

## Ambientes e .env

- `./.env`: Docker/Compose (Postgres)
- `./.env.example`: exemplo base para Docker/Compose
- `apps/api/.env`: ambiente local atual (teste rapido; SQLite)
- `apps/web/.env.local`: URL da API no frontend local

## Retomar amanha (rapido)

1. Testar `http://127.0.0.1:8000/health` e `http://127.0.0.1:3000`.
2. Se precisar subir manualmente:
   `apps/api`: `.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
   `apps/web`: `corepack pnpm dev`
3. Login demo -> entrar com codigo `demo123` -> testar fluxo `round / admin / ranking`.
4. Para deploy real, usar Postgres (Docker Compose) em vez do SQLite local.

## Observacoes importantes

- CORS local configurado para `localhost` e `127.0.0.1`.
- Validado localmente: migration, seed demo e `next build`.

## Estrutura

- `apps/web`: Next.js App Router + TypeScript + Tailwind + TanStack Query + RHF + Zod + PWA
- `apps/api`: FastAPI + PostgreSQL + SQLAlchemy + Alembic + JWT
- `infra/nginx`: reverse proxy para `web` e `api`

## Comandos (dev)

### Backend

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd apps/web
pnpm install
# se estiver rodando o back em http://localhost:8000, use:
# NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev
pnpm dev
```

## Comando (prod)

```bash
docker compose up -d --build
```

## Exemplos de payloads (API)

### Register

`POST /api/auth/register`

```json
{
  "name": "Fred",
  "email": "fred@example.com",
  "password": "123456"
}
```

### Criar grupo

`POST /api/groups`

```json
{
  "name": "Pelada da Quinta"
}
```

### Confirmar presença

`POST /api/matchdays/1/attendance`

```json
{
  "player_id": 3,
  "status": "CONFIRMED"
}
```

### Lançar resultado

`POST /api/matches/1/result`

```json
{
  "home_score": 5,
  "away_score": 4
}
```

## Prints de rotas (exemplos)

### Standings (`GET /api/seasons/{id}/standings`)

```json
{
  "season_id": 1,
  "items": [
    {
      "player_id": 3,
      "player_name": "João",
      "points": 7,
      "wins": 2,
      "draws": 1,
      "losses": 0,
      "no_shows": 0
    }
  ]
}
```

### Player stats (`GET /api/seasons/{id}/player-stats`)

```json
{
  "season_id": 1,
  "items": [
    {
      "player_id": 3,
      "goals": 4,
      "appearances": 3
    }
  ]
}
```

## Seed demo (opcional)

Script em `apps/api/scripts/seed_demo.py`.

Exemplo:

```bash
cd apps/api
alembic upgrade head
python scripts/seed_demo.py
```

## Parar servidores locais

```powershell
Stop-Process -Id <PID_API>,<PID_WEB>
```

## Deploy automático ativo 🚀

Este commit foi usado para testar o deploy automático via GitHub Actions + self-hosted runner no servidor Hetzner.
