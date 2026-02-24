# HubFutebol MVP

MVP mobile-first para microcampeonatos de pelada (grupos fechados), com frontend em Next.js e backend em FastAPI.

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
