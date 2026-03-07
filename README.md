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

## Deploy automático ativo 🚀

Este commit foi usado para testar o deploy automático via GitHub Actions + self-hosted runner no servidor Hetzner.
# HubFutebol

Sistema MVP para gestão de times e campeonatos de futebol amador.

## Arquitetura

O projeto roda em containers Docker com a seguinte estrutura:

* **web** – Frontend Next.js
* **api** – Backend FastAPI
* **db** – PostgreSQL
* **reverse-proxy** – Nginx
* **uptime-kuma** – Monitoramento
* **netdata** – Métricas do servidor

## Infraestrutura

Servidor: Hetzner
Rede privada: Tailscale
Orquestração: Docker Compose

## Containers principais

| Serviço       | Função           | Porta |
| ------------- | ---------------- | ----- |
| web           | Frontend Next.js | 3000  |
| api           | Backend FastAPI  | 8000  |
| db            | PostgreSQL       | 5432  |
| reverse-proxy | Nginx            | 8080  |
| uptime-kuma   | Monitoramento    | 3001  |
| netdata       | Métricas         | 19999 |

## Estrutura do projeto

```
HubFutebol
├── apps
│   ├── api
│   └── web
├── infra
│   └── nginx
├── docker-compose.yml
```

## Subindo o projeto

```bash
git pull
cd ~/HubFutebol
docker compose up -d --build
```

## Verificar containers

```bash
docker compose ps
```

## Logs

```bash
docker compose logs -f
```

## Backup automático do banco

Backups rodam diariamente às 03:00.

Script:

```
~/scripts/backup_hubfutebol_postgres.sh
```

Local dos backups:

```
~/backups/hubfutebol/postgres
```

Executar manualmente:

```bash
~/scripts/backup_hubfutebol_postgres.sh
```

## Monitoramento

### Uptime Kuma

Acesso via Tailscale:

```
http://100.83.83.44:3001
```

Monitor configurado para verificar o Nginx interno:

```
http://hubfutebol-reverse-proxy-1
```

### Netdata

Dashboard:

```
http://100.83.83.44:19999
```

Mostra:

* CPU
* RAM
* Docker containers
* Rede
* Disco

## Atualização do sistema

```bash
cd ~/HubFutebol
git pull
docker compose up -d --build
```

## Reiniciar serviços

```bash
docker compose restart
```

## Reiniciar somente API

```bash
docker compose restart api
```

## Reiniciar Nginx

```bash
docker compose restart reverse-proxy
```

## Banco de dados

Entrar no container:

```bash
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB
```

## Health check rápido

Testar Nginx:

```bash
curl -I http://localhost:8080
```

Testar API:

```bash
curl -I http://localhost:8000
```

## Redes Docker

Rede principal do sistema:

```
hubfutebol_default
```

Containers conectados:

* api
* web
* db
* reverse-proxy
* uptime-kuma

## Segurança

* acesso externo apenas via Tailscale
* serviços internos não expostos publicamente

## Próximos passos

* autenticação de usuários
* gestão de times
* controle de pagamentos
* criação de campeonatos
* geração automática de tabela

---

Projeto em desenvolvimento.
