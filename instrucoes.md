Você é um engenheiro sênior full-stack. Quero um MVP mobile-first (navegador do celular) para microcampeonatos de pelada (grupos fechados). 
Entregue FRONTEND + BACKEND + DOCKER para deploy em VPS.

STACK OBRIGATÓRIA:
- Front: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query + React Hook Form + Zod
- PWA: manifest.json + service worker + ícone + modo standalone
- Back: FastAPI + PostgreSQL + SQLAlchemy + Alembic + JWT auth
- Infra: Docker Compose (web, api, db, reverse proxy) pronto para produção básica

OBJETIVO DO MVP:
Rodar bem no navegador do celular e ser usado via link no WhatsApp.
Fluxo principal: entrar no grupo -> confirmar presença -> ver lista -> admin gera times -> admin lança placar -> ranking atualizado.

MODELO DE DOMÍNIO (mínimo necessário mas escalável):
User, Group, Membership(role OWNER/ADMIN/MEMBER), Player(group-scoped, opcionalmente ligado a User),
Season(1 ativa por group), ScoringRule(por season), MatchDay, Match, Team, TeamPlayer, Appearance(status),
MatchEvent(type GOAL opcional), SeasonStandings(cache), PlayerSeasonStats(cache),
Ledger e LedgerEntry (finance lite) opcionais no UI mas suportados na API.

REGRAS:
- Pontos por season: W=3, D=1, L=0, NO_SHOW=-1 (configurável via ScoringRule).
- Penalidade só para NO_SHOW.
- MatchDay tem lock: após lock, gera 2 times (A/B) balanceando por posição quando houver.
- Lançar resultado atualiza standings e stats.

APIs:
Auth: POST /auth/register, POST /auth/login
Groups: POST /groups, GET /groups/{id}, POST /groups/{id}/invite, POST /groups/join
Players: POST /groups/{id}/players, GET /groups/{id}/players, PATCH /players/{id}
Seasons: POST /groups/{id}/seasons, POST /seasons/{id}/close, GET /seasons/{id}/standings, GET /seasons/{id}/player-stats
MatchDays: POST /seasons/{id}/matchdays, GET /matchdays/{id}, POST /matchdays/{id}/attendance, POST /matchdays/{id}/lock
Matches: POST /matchdays/{id}/matches, POST /matches/{id}/result
Finance: POST /groups/{id}/ledger/entries, GET /groups/{id}/ledger

PERMISSÕES:
OWNER/ADMIN: criar temporada, lançar resultados, marcar NO_SHOW, lock matchday, gerar times.
MEMBER: confirmar presença e visualizar.

FRONTEND – TELAS (mobile-first com bottom nav):
- /login e /register
- /join (entrar com código/link)
- /g/[groupId]/round (rodada atual: confirmar presença + lista)
- /g/[groupId]/ranking (tabela)
- /g/[groupId]/players (jogadores)
- /g/[groupId]/admin (lock + gerar times + lançar placar)
Requisitos:
- UI com botões grandes e layout responsivo.
- Carregamento via TanStack Query.
- Forms com React Hook Form + Zod.
- Guardas de rota (auth + role).

ENTREGÁVEIS:
- Monorepo com apps/web e apps/api
- Migrations iniciais
- Seed opcional para demo
- Docker Compose com nginx/traefik reverso
- README com comandos:
  - dev: pnpm dev + uvicorn
  - prod: docker compose up -d
- Exemplos de payloads e prints de rotas no README