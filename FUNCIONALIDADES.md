# Funcionalidades do HubFutebol (MVP)

Este documento descreve o que cada parte do aplicativo faz no MVP local.

## Objetivo do app

Organizar microcampeonatos de pelada em grupos fechados, com foco em uso pelo celular (link no WhatsApp).

Fluxo principal:

1. Entrar no grupo
2. Confirmar presenca na rodada
3. Ver lista de presencas
4. Admin faz lock e gera times
5. Admin lanca placar
6. Ranking e stats atualizam

## Perfis de acesso

- `OWNER`: dono do grupo (controle total)
- `ADMIN`: administrador do grupo
- `MEMBER`: participante comum

## O que cada perfil pode fazer

### OWNER / ADMIN

- Criar temporada
- Criar rodada (matchday)
- Gerar convite (codigo/link)
- Fazer lock da rodada
- Gerar times automaticamente (A/B)
- Lancar resultado da partida
- Cadastrar e editar jogadores
- Marcar presenca/no-show (via API e tela admin/rodada)
- Ver ranking, stats, jogadores e rodada

### MEMBER

- Entrar com codigo/link de convite
- Confirmar presenca na rodada (somente no jogador vinculado ao proprio usuario)
- Ver lista de presencas
- Ver ranking
- Ver jogadores
- Ver area admin (mas sem permissao para executar acoes restritas)

## Telas do frontend (mobile-first)

## `/`

- Tela inicial com atalhos para:
  - Login
  - Cadastro
  - Entrar com codigo

## `/login`

- Autenticacao por email e senha
- Salva sessao no navegador (token JWT + usuario)
- Redireciona para `/join` apos login

## `/register`

- Cadastro de usuario (nome, email, senha)
- Faz login automatico apos cadastro
- Redireciona para `/join`

## `/join`

- Entrar em grupo por codigo de convite
- Aceita codigo digitado manualmente
- Tambem aceita `?code=` na URL (link do WhatsApp)
- Ao entrar com sucesso, redireciona para `/g/{groupId}/round`

## `/g/[groupId]/round` (Rodada atual)

- Mostra a rodada atual da temporada ativa
- Exibe status da rodada (`ABERTA` / `LOCK`)
- Formulario de presenca:
  - escolher jogador
  - definir status (`CONFIRMED`, `DECLINED`, `NO_SHOW`)
- Lista de jogadores com status atual de presenca
- Atualiza dados via TanStack Query

## `/g/[groupId]/ranking`

- Mostra tabela da temporada (pontos, W/D/L, no-show, jogos)
- Mostra stats por jogador (gols, presencas, no-shows)
- Dados vindos da API com cache/reload via TanStack Query

## `/g/[groupId]/players`

- Lista jogadores do grupo (posicao, forca, ativo/inativo)
- Admin/Owner podem:
  - cadastrar novo jogador
  - ativar/inativar jogador
- Member pode visualizar

## `/g/[groupId]/admin`

- Painel de administracao do grupo
- Funcoes:
  - Gerar convite (codigo + link)
  - Criar temporada (com regras de pontuacao)
  - Criar rodada
  - Fazer lock + gerar times (A/B)
  - Ver composicao dos times gerados
  - Lancar placar (Time A x Time B)

## Navegacao

- Bottom nav mobile:
  - Rodada
  - Ranking
  - Jogadores
  - Admin

## Regras de negocio (MVP)

## Temporada e pontuacao

- Cada grupo pode ter uma temporada ativa
- Regra de pontuacao configuravel por temporada:
  - `W` (vitoria): padrao `3`
  - `D` (empate): padrao `1`
  - `L` (derrota): padrao `0`
  - `NO_SHOW`: padrao `-1`
- Penalidade aplica somente para `NO_SHOW`

## Rodada (MatchDay)

- Rodada pode ficar aberta para confirmacao de presenca
- Quando admin faz `lock`, a rodada e travada
- O lock gera automaticamente:
  - `2 times` (Time A e Time B)
  - `1 partida` (A x B)

## Geracao de times

- Usa jogadores com presenca `CONFIRMED`
- Tenta balancear por:
  - posicao (quando informada)
  - `skill_rating` (forca)
- Resultado gera `Time A` e `Time B` com soma de forca

## Resultado e ranking

- Ao lancar o placar:
  - salva resultado da partida
  - recalcula standings da temporada
  - recalcula stats dos jogadores
- Ranking e stats sao mantidos em tabelas de cache para leitura rapida

## Entidades principais (resumo)

- `User`: usuario com login
- `Group`: grupo da pelada
- `Membership`: vinculo do usuario no grupo com papel (`OWNER/ADMIN/MEMBER`)
- `Player`: jogador do grupo (pode ou nao estar vinculado a um `User`)
- `Season`: temporada do grupo
- `ScoringRule`: regra de pontuacao da temporada
- `MatchDay`: rodada
- `Appearance`: presenca por jogador na rodada
- `Team`: time gerado na rodada
- `TeamPlayer`: jogadores que pertencem ao time
- `Match`: partida da rodada (A x B)
- `MatchEvent`: eventos da partida (ex.: gol)
- `SeasonStandings`: cache de ranking da temporada
- `PlayerSeasonStats`: cache de stats por jogador
- `Ledger` / `LedgerEntry`: financeiro simples (API suportada)

## APIs principais (o que fazem)

### Auth

- `POST /auth/register`: cria usuario e retorna token JWT
- `POST /auth/login`: autentica e retorna token JWT

### Groups

- `POST /groups`: cria grupo
- `GET /groups/{id}`: detalhes do grupo
- `POST /groups/{id}/invite`: gera codigo/link de convite
- `POST /groups/join`: entra no grupo via codigo

### Players

- `POST /groups/{id}/players`: cadastra jogador no grupo
- `GET /groups/{id}/players`: lista jogadores do grupo
- `PATCH /players/{id}`: atualiza jogador (ex.: ativo/inativo)

### Seasons

- `POST /groups/{id}/seasons`: cria temporada e regra de pontuacao
- `POST /seasons/{id}/close`: encerra temporada
- `GET /seasons/{id}/standings`: ranking da temporada
- `GET /seasons/{id}/player-stats`: stats dos jogadores
- `GET /seasons/{id}/matchdays`: lista rodadas da temporada

### MatchDays

- `POST /seasons/{id}/matchdays`: cria rodada
- `GET /matchdays/{id}`: detalhes da rodada (presenca, times, partidas)
- `POST /matchdays/{id}/attendance`: confirma/atualiza presenca
- `POST /matchdays/{id}/lock`: trava rodada e gera times

### Matches

- `POST /matchdays/{id}/matches`: cria partida manual (suporte adicional)
- `POST /matches/{id}/result`: lanca placar e atualiza ranking/stats

### Finance

- `POST /groups/{id}/ledger/entries`: cria lancamento financeiro
- `GET /groups/{id}/ledger`: consulta saldo e lancamentos

## PWA (uso no celular)

- `manifest.json` configurado
- `service worker` para cache basico
- icone do app (`icon.svg`)
- modo `standalone` (instalavel no celular)

## Ambiente local atual (teste)

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- Conta demo:
  - `demo@hubfutebol.dev`
  - senha `123456`
  - codigo `demo123`

## Limitacoes atuais do MVP

- Sem tela dedicada para criar grupo (API existe; pode ser usada via cliente/API tool)
- Gols detalhados por jogador existem na API, mas tela admin atualmente lanca placar sem detalhar eventos
- Financeiro suportado na API, mas UI ainda nao exposta
- Deploy local de teste atual usa SQLite (deploy real continua recomendado com Postgres)

