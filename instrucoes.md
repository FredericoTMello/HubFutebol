# Briefing inicial do MVP

Este arquivo registra o pedido original que deu origem ao projeto. Ele deve ser mantido apenas como contexto historico.

Nao use este documento como fonte da verdade para o estado atual do produto. Para o projeto como ele existe hoje, priorize:

1. `README.md`
2. `FUNCIONALIDADES.md`
3. `README_OPERACIONAL.md`
4. `instrucao2.md`

## Resumo do briefing original

- Entregar um MVP mobile-first para grupos fechados de pelada
- Stack principal:
  - Next.js + TypeScript + Tailwind no frontend
  - FastAPI + PostgreSQL + SQLAlchemy + Alembic no backend
  - Docker Compose com `web`, `api`, `db` e proxy reverso
- Fluxo principal:
  - entrar no grupo
  - confirmar presenca
  - gerar times
  - lancar placar
  - atualizar ranking
- Permissoes:
  - `OWNER` e `ADMIN` gerenciam temporada, rodada e resultado
  - `MEMBER` confirma presenca e consulta dados
- Entregaveis:
  - monorepo
  - migrations iniciais
  - seed demo
  - README com comandos de dev e prod

## Observacao

O projeto ja evoluiu em cima desse escopo inicial. Quando houver divergencia entre este arquivo e o codigo atual, o codigo e a documentacao principal vencem.
