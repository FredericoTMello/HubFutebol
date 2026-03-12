# HubFutebol — Resumo do Produto

## O que e

App mobile-first para organizar peladas. Feito para grupos de amigos que jogam futebol regularmente e querem sair da planilha do WhatsApp. Roda no navegador do celular, funciona como PWA (pode ser instalado na tela inicial).

---

## Como usar (fluxo principal)

### 1. Criar conta e entrar no grupo

- Acesse o app, crie uma conta com nome/email/senha
- O admin do grupo gera um **codigo de convite** e compartilha no WhatsApp
- Cole o codigo (ou abra o link) para entrar no grupo automaticamente

### 2. Confirmar presenca

- Na aba **Rodada**, veja a rodada da semana
- Selecione seu nome e confirme: **Confirmado**, **Ausente** ou **No-show**
- Todo mundo do grupo ve a lista de quem vai

### 3. Gerar times (admin)

- Quando todas as presencas estiverem confirmadas, o admin clica em **Lock + Gerar Times**
- O sistema cria Time A e Time B automaticamente, balanceando por posicao e nivel de habilidade
- A rodada fica travada (ninguem mais altera presenca)

### 4. Jogar e lancar placar (admin)

- Depois do jogo, o admin entra na aba **Admin** e lanca o placar
- O ranking e as estatisticas se atualizam na hora

### 5. Acompanhar ranking

- Na aba **Ranking**, veja a tabela de pontos da temporada (vitorias, empates, derrotas, no-shows)
- Veja tambem estatisticas: gols marcados, presencas e no-shows por jogador

---

## Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| **Owner** | Tudo — e o dono do grupo |
| **Admin** | Criar temporadas, rodadas, gerar times, lancar placar, cadastrar jogadores, gerar convite |
| **Membro** | Confirmar propria presenca, ver ranking, ver jogadores, ver rodada |

---

## O que ja funciona

- Cadastro e login com JWT
- Criacao de grupo e convite por codigo/link
- Cadastro de jogadores com posicao (DEF/MID/FWD/GK) e nivel (1-10)
- Temporadas com pontuacao configuravel (V/E/D/No-show)
- Rodadas com confirmacao de presenca
- Geracao automatica de 2 times balanceados
- Lancamento de placar com atualizacao automatica de ranking
- Ranking e estatisticas por temporada
- Caixa do grupo (API de financeiro — entradas, saidas, saldo)
- PWA instalavel no celular
- Deploy automatico via GitHub Actions

---

## O que ainda NAO funciona / limitacoes

| Limitacao | Detalhe |
|---|---|
| Criar grupo pela interface | A API existe, mas nao ha botao/tela no app — grupos sao criados via API ou seed |
| Financeiro na interface | O caixa do grupo (ledger) so funciona via API; nao ha tela no app |
| Gols por jogador na UI | A API aceita gols individuais no placar, mas a tela so lanca placar geral (Time A x Time B) |
| Multiplas partidas por rodada | O lock gera 1 partida automatica; para rodadas com 3+ times seria necessario criar manualmente |
| Notificacoes | Nao ha push notification nem email — presenca depende de o jogador abrir o app |
| Historico de temporadas | So a temporada ativa e exibida; temporadas encerradas nao aparecem na UI |
| Edicao de perfil | Nao e possivel trocar nome, email ou senha depois do cadastro |
| Recuperacao de senha | Nao existe "esqueci minha senha" |

---

## Funcionalidades futuras sugeridas

### Curto prazo (complementam o que ja existe)

- Tela de criar grupo — botao na home para criar grupo sem precisar de API
- Tela do financeiro — ver saldo, lancar mensalidade e despesas pelo app
- Gols por jogador na UI — ao lancar placar, selecionar quem fez os gols
- Historico de temporadas — listar temporadas passadas com ranking final
- Edicao de perfil — trocar nome e senha

### Medio prazo (melhoram a experiencia)

- Notificacoes (push/WhatsApp) — lembrar de confirmar presenca
- Sorteio de times com variacoes — times de 3, 4 ou 5; modo "chapeu" aleatorio
- Foto de perfil / avatar — identificacao visual dos jogadores
- Recuperacao de senha — fluxo de "esqueci minha senha" por email
- Dashboard do grupo — resumo visual com proxima rodada, ranking resumido, saldo do caixa
- Multiplas partidas por rodada — suporte a 3+ times com rodizio

### Longo prazo (escalam o produto)

- Confronto direto (head-to-head) — estatisticas de jogador vs jogador
- Modo torneio — chaves eliminatorias e mata-mata
- Integracao com calendario — adicionar rodada ao Google Calendar
- Compartilhamento de ranking — gerar imagem do ranking para postar no grupo do WhatsApp
- Multi-grupo — um jogador participa de varias peladas diferentes
- App nativo (React Native) — se a base de usuarios justificar
