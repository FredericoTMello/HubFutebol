# Guia interno de trabalho

Este e o guia interno atual para evoluir o HubFutebol sem perder simplicidade e estabilidade.

## Objetivo do projeto

HubFutebol e um MVP/SaaS mobile-first para futebol amador. O foco agora e uso real com pouca friccao no celular, nao expansao de escopo por volume.

## Documentos de referencia

Use nesta ordem:

1. `README.md`
2. `FUNCIONALIDADES.md`
3. `README_OPERACIONAL.md`
4. `docs/instrucoes.md` apenas como historico

## Prioridades

1. estabilidade em producao
2. simplicidade do codigo
3. fluidez mobile-first
4. velocidade de entrega
5. facilidade de manutencao
6. performance
7. estetica

## Regras de trabalho

Antes de editar:

- entender a parte do fluxo impactada
- mapear arquivos alterados
- descrever problema, causa provavel, solucao proposta e risco

Ao implementar:

- manter compatibilidade com o ambiente atual
- evitar refactor grande sem necessidade
- nao misturar bugfix com reorganizacao ampla
- evitar dependencias novas sem justificativa forte
- respeitar o padrao ja adotado no projeto

Ao finalizar:

- resumir o que mudou
- listar arquivos alterados
- explicar como testar
- registrar riscos remanescentes

## Regras de produto

Sempre preferir a solucao que:

- entrega valor agora
- reduz friccao no celular
- tem menor risco operacional
- e mais facil de manter

Evitar:

- feature prematura
- abstracao exagerada
- complexidade por vaidade tecnica
- mudanca arquitetural sem necessidade clara

## Regras por area

### Frontend

- manter navegacao simples
- evitar componentes gigantes
- preservar consistencia visual
- priorizar clareza em tela pequena

### Backend

- manter rotas previsiveis
- validar entradas explicitamente
- evitar duplicacao de regra
- tratar migracoes como mudanca sensivel

### Banco de dados

- nao assumir banco descartavel
- preferir migracoes pequenas e seguras
- evitar mudancas destrutivas sem motivo forte

### Producao

- nao quebrar `docker compose`
- nao quebrar o workflow de deploy
- nao alterar backup, monitoramento ou acesso administrativo sem avisar
- sempre validar build e healthcheck quando possivel

## Definicao de sucesso

Uma boa entrega no HubFutebol e simples, funcional, segura, facil de testar e util para o usuario real.
