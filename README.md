# HubFutebol

HubFutebol e um MVP mobile-first para organizar peladas e microcampeonatos em grupos fechados. O fluxo principal foi desenhado para uso rapido no celular: entrar no grupo, confirmar presenca, travar a rodada, gerar times e atualizar o ranking.

## Estado atual

- Monorepo com `apps/web` e `apps/api`
- Frontend em Next.js com App Router
- Backend em FastAPI com SQLAlchemy, Alembic e JWT
- Infra versionada com Docker Compose, Postgres e Nginx
- Deploy automatico em servidor Hetzner por GitHub Actions + self-hosted runner
- Infra suficiente para um piloto pequeno; monitoramento e rotinas extras de servidor sao externos ao repositorio

## Estrutura

```text
.
|-- apps/
|   |-- api/
|   `-- web/
|-- infra/
|   `-- nginx/
|-- docker-compose.yml
|-- README.md
|-- README_OPERACIONAL.md
|-- FUNCIONALIDADES.md
|-- instrucao2.md
`-- instrucoes.md
```

## Documentacao

- `README.md`: visao geral, setup e fluxo de uso do repositorio
- `README_OPERACIONAL.md`: runbook enxuto para a instancia em producao
- `FUNCIONALIDADES.md`: regras de negocio, telas e limites atuais do MVP
- `instrucao2.md`: guia interno atual para evolucao tecnica do projeto
- `instrucoes.md`: briefing inicial que originou o MVP; manter apenas como historico

## Rodar com Docker

Este e o caminho mais simples para subir o projeto com paridade razoavel com producao.

1. Crie o arquivo `.env` com base em `.env.example`.
2. Rode:

```bash
docker compose up -d --build
```

3. Acesse a aplicacao em `http://127.0.0.1:8080`
4. Valide o healthcheck em `http://127.0.0.1:8080/api/health`

Observacao: no modo Docker, a API nao fica exposta diretamente na porta `8000` do host; o acesso passa pelo Nginx.

## Rodar em desenvolvimento

### API

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

No Windows PowerShell, a ativacao da virtualenv fica em:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Web

```bash
cd apps/web
pnpm install
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 pnpm dev
```

No Windows PowerShell:

```powershell
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
pnpm dev
```

Com esse fluxo, o frontend roda em `http://127.0.0.1:3000` e a API em `http://127.0.0.1:8000`.

## Testes

### Backend

```bash
cd apps/api
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
.\.venv\Scripts\python -m pytest -q
```

### Frontend

```bash
cd apps/web
corepack pnpm install
corepack pnpm test
```

## Variaveis de ambiente

- `./.env`: compose, Postgres e deploy
- `./.env.example`: base para criar o `.env`
- `apps/web/.env.local`: opcional para rodar o frontend fora do Docker
- `apps/api/.env`: opcional para rodar a API fora do Docker

O alvo principal do projeto e Postgres. O codigo ainda aceita SQLite para testes locais rapidos, mas nao e o caminho recomendado para deploy.

## Seed demo

O script de seed fica em `apps/api/scripts/seed_demo.py`.

Exemplo:

```bash
cd apps/api
alembic upgrade head
python scripts/seed_demo.py
```

Credenciais demo:

- Email: `demo@hubfutebol.dev`
- Senha: `123456`
- Codigo de convite: `demo123`

## API principal

- `POST /auth/register`
- `POST /auth/login`
- `POST /groups`
- `GET /groups/{id}`
- `POST /groups/{id}/invite`
- `POST /groups/join`
- `POST /groups/{id}/players`
- `GET /groups/{id}/players`
- `PATCH /players/{id}`
- `POST /groups/{id}/seasons`
- `POST /seasons/{id}/close`
- `GET /seasons/{id}/standings`
- `GET /seasons/{id}/player-stats`
- `GET /seasons/{id}/matchdays`
- `POST /seasons/{id}/matchdays`
- `GET /matchdays/{id}`
- `POST /matchdays/{id}/attendance`
- `POST /matchdays/{id}/lock`
- `POST /matchdays/{id}/matches`
- `POST /matches/{id}/result`
- `POST /groups/{id}/ledger/entries`
- `GET /groups/{id}/ledger`

## Deploy

- `push` para `main` dispara o workflow em `.github/workflows/deploy.yml`
- O runner faz `git reset --hard`, `docker compose up -d --build` e healthcheck com rollback em caso de falha
- Para manutencao manual local ou no servidor, o comando base continua sendo:

```bash
docker compose up -d --build
```

## Observacoes

- O healthcheck da API e `GET /health`
- O Compose versionado cobre `db`, `api`, `web` e `reverse-proxy`
- Monitoramento, backup e acessos administrativos do servidor existem fora do repositorio e devem ser tratados como operacao externa
- Ha suites iniciais de testes no backend e no frontend; a cobertura ainda e parcial
