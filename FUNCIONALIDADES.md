# Funcionalidades do HubFutebol

Este documento descreve o comportamento funcional do MVP no estado atual do repositorio.

## Objetivo

Organizar peladas e microcampeonatos em grupos fechados, com foco em uso rapido no navegador do celular.

Fluxo principal:

1. Entrar no grupo
2. Confirmar presenca na rodada
3. Ver a lista de confirmacoes
4. Travar a rodada
5. Gerar os times
6. Lancar o placar
7. Atualizar ranking e estatisticas

## Perfis de acesso

- `OWNER`: dono do grupo
- `ADMIN`: administrador do grupo
- `MEMBER`: participante comum

## Permissoes por perfil

### OWNER e ADMIN

- Criar temporada
- Criar rodada
- Gerar convite por codigo ou link
- Travar a rodada
- Gerar times automaticamente
- Lancar resultado
- Cadastrar e editar jogadores
- Marcar presenca ou `NO_SHOW`
- Consultar rodada, jogadores, ranking e area administrativa

### MEMBER

- Entrar em grupo por codigo ou link
- Confirmar a propria presenca
- Ver lista de presencas
- Ver ranking
- Ver jogadores
- Acessar a area administrativa sem executar acoes restritas

## Telas do frontend

### `/`

- Entrada simples para login, cadastro e entrada por codigo

### `/login`

- Login por email e senha
- Persistencia de sessao no navegador
- Redirecionamento para `/join`

### `/register`

- Cadastro com login automatico
- Redirecionamento para `/join`

### `/join`

- Entrada em grupo por codigo de convite
- Aceita codigo manual ou `?code=` na URL
- Redireciona para `/g/{groupId}/round`

### `/g/[groupId]/round`

- Exibe a rodada atual da temporada ativa
- Mostra status da rodada
- Permite confirmar ou atualizar presenca
- Lista os jogadores com o status atual

### `/g/[groupId]/ranking`

- Mostra tabela da temporada
- Mostra estatisticas por jogador

### `/g/[groupId]/players`

- Lista jogadores do grupo
- Permite cadastro e alteracao para `OWNER` e `ADMIN`

### `/g/[groupId]/admin`

- Gera convite
- Cria temporada
- Cria rodada
- Faz lock da rodada
- Gera times A/B
- Exibe composicao dos times
- Lanca placar

## Regras de negocio

### Temporada

- Cada grupo pode ter uma temporada ativa por vez
- A regra de pontuacao e configuravel por temporada
- Valores padrao:
  - vitoria = `3`
  - empate = `1`
  - derrota = `0`
  - `NO_SHOW` = `-1`

### Rodada

- A rodada comeca aberta para confirmacao
- Quando o admin faz lock, a rodada e travada
- O lock gera dois times e uma partida

### Geracao de times

- Considera apenas jogadores com status `CONFIRMED`
- Tenta balancear por posicao e `skill_rating`

### Resultado

- O placar salvo atualiza ranking e estatisticas
- Ranking e stats ficam em tabelas de cache para leitura rapida

## Modelo de dominio

- `User`
- `Group`
- `Membership`
- `Player`
- `Season`
- `ScoringRule`
- `MatchDay`
- `Appearance`
- `Team`
- `TeamPlayer`
- `Match`
- `MatchEvent`
- `SeasonStandings`
- `PlayerSeasonStats`
- `Ledger`
- `LedgerEntry`

## API resumida

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Groups

- `POST /groups`
- `GET /groups/{id}`
- `POST /groups/{id}/invite`
- `POST /groups/join`

### Players

- `POST /groups/{id}/players`
- `GET /groups/{id}/players`
- `PATCH /players/{id}`

### Seasons

- `POST /groups/{id}/seasons`
- `POST /seasons/{id}/close`
- `GET /seasons/{id}/standings`
- `GET /seasons/{id}/player-stats`
- `GET /seasons/{id}/matchdays`

### MatchDays

- `POST /seasons/{id}/matchdays`
- `GET /matchdays/{id}`
- `POST /matchdays/{id}/attendance`
- `POST /matchdays/{id}/lock`

### Matches

- `POST /matchdays/{id}/matches`
- `POST /matches/{id}/result`

### Finance

- `POST /groups/{id}/ledger/entries`
- `GET /groups/{id}/ledger`

## PWA

- `manifest.json`
- `service worker`
- icone do app
- modo `standalone`

## Limitacoes atuais

- Nao ha tela dedicada para criar grupo na home; a API existe
- O admin lanca placar, mas nao detalha eventos por jogador na UI
- O financeiro existe na API, mas ainda nao foi levado para a interface
- O projeto ainda aceita SQLite para testes locais, embora o deploy alvo use Postgres
- Ja existe uma suite inicial de testes no backend e no frontend, mas a cobertura ainda e parcial
