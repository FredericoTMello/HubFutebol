# TASKS

## Status de Execucao - 2026-03-11

- Alta prioridade concluida e validada nesta branch local.
- Media prioridade concluida e validada nesta branch local.
- Backend:
  - `apps/api/app/models.py` foi dividido em `apps/api/app/models/`
  - `apps/api/app/schemas.py` foi dividido em `apps/api/app/schemas/`
  - `apps/api/app/services.py` foi dividido em `apps/api/app/services/`
  - imports inline removidos em `routers/matchdays.py`, `routers/finance.py` e no fluxo de ledger
  - `apps/api/alembic/versions/0001_initial.py` reescrita com `op.create_table(...)`
  - suite inicial de `pytest` criada e validada
  - prefixes internos dos routers foram padronizados sem mudar os endpoints publicos consumidos pelo frontend
  - `serialize_matchday` agora devolve `MatchDayOut` tipado com submodels
  - paginação por `limit` e `offset` foi adicionada em `list_players`, `list_matchdays`, `season_standings`, `player_stats` e `get_ledger`
  - configuracao de lint/format Python adicionada com `apps/api/pyproject.toml` + Ruff
- Repositorio:
  - `.gitignore` atualizado para ignorar `*.db` e `.run/`
  - `apps/api/hubfutebol.db` e `.run/*` removidos do tracking com `git rm --cached`
  - `pnpm-lock.yaml` voltou para o versionamento
- Frontend:
  - suite inicial com Vitest + Testing Library criada e validada
  - `admin/page.tsx` foi quebrada em componentes por fluxo
  - `round/page.tsx` foi quebrada em componentes por fluxo
  - `loading/error/empty` agora usam estado compartilhado no frontend
  - `apps/web/components/` foi consolidado em `components/app/` e `components/ui/`
  - `apps/web` continua compativel com os mesmos paths publicos da API
- Validacao executada:
  - `apps/api`: `.venv\\Scripts\\python -m pytest -q` -> `5 passed`
  - `apps/api`: `.venv\\Scripts\\python -m ruff check --fix .` -> ok
  - `apps/api`: `.venv\\Scripts\\python -m ruff format .` -> ok
  - `apps/web`: `corepack pnpm exec tsc -p tsconfig.json --noEmit` -> ok
  - `apps/web`: `corepack pnpm test` -> `8 passed`

## Alta Prioridade

- [x] Dividir `apps/api/app/models.py` em arquivos separados por dominio com barrel `models/__init__.py`
- [x] Dividir `apps/api/app/schemas.py` em modulos separados alinhados aos routers
- [x] Extrair `apps/api/app/services.py` em camada de services por dominio
- [x] Remover `apps/api/hubfutebol.db` do repositorio e adicionar `*.db` ao `.gitignore`
- [x] Adicionar `.run/` ao `.gitignore` e remover do tracking
- [x] Criar suite de testes para o backend com `pytest`
- [x] Criar testes para o frontend com Vitest + Testing Library
- [x] Eliminar imports inline/circulares em `matchdays.py`, `finance.py` e no antigo `services.py`
- [x] Reescrever `apps/api/alembic/versions/0001_initial.py` com operacoes explicitas de migracao

## Media Prioridade

- [x] Decompor `apps/web/app/g/[groupId]/admin/page.tsx` em subcomponentes (`InviteCard`, `SeasonForm`, `MatchdayManager`, `ResultForm`)
- [x] Decompor `apps/web/app/g/[groupId]/round/page.tsx` extraindo `AttendanceForm` e `AttendanceList`
- [x] Criar padrao compartilhado para loading/error states nas paginas do frontend
- [x] Padronizar prefixos de rotas da API
- [x] Refatorar `apps/api/app/routers/utils.py` (`serialize_matchday`) para usar serializacao via Pydantic models
- [x] Separar `apps/web/components/` em `components/app/` e `components/ui/`
- [x] Reverter `pnpm-lock.yaml` no `.gitignore` e commita-lo
- [x] Adicionar configuracao de linting/formatting Python (`pyproject.toml` com Ruff ou Black + isort)
- [x] Adicionar paginacao nos endpoints de listagem (`list_players`, `list_matchdays`, `season_standings`, `player_stats`, `get_ledger`)

## Baixa Prioridade / Melhorias Futuras

- [ ] Remover arquivos temporarios de instrucao da raiz (`instrucoes.md`, `instrucao2.md`) ou move-los para `docs/`
- [ ] Substituir campo livre `position: str` em `Player` por um Enum (`DEF`, `MID`, `FWD`, `GK`)
- [ ] Remover `version: "3.9"` de `docker-compose.yml`
- [ ] Adicionar Error Boundary no frontend (`apps/web/app/`)
- [ ] Adicionar versionamento na API (`/v1/auth/...`, `/v1/groups/...`)
- [ ] Configurar ESLint com regras mais estritas para o frontend (`apps/web/`)
- [ ] Criar `apps/api/app/exceptions.py` com excecoes de dominio customizadas em vez de usar `HTTPException` diretamente nos services
- [ ] Adicionar `apps/web/middleware.ts` para protecao de rotas server-side em vez de depender apenas do `AuthGate` client-side
- [x] Tipar o retorno de `apps/api/app/routers/utils.py:serialize_matchday`
