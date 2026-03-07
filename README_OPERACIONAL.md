# README Operacional

Guia operacional enxuto para manter a instancia atual do HubFutebol rodando.

## Escopo

Este documento cobre o que o repositorio realmente versiona:

- `db`
- `api`
- `web`
- `reverse-proxy`

Itens como Tailscale, monitoramento, backups agendados e configuracao do servidor podem existir em producao, mas sao externos a este repositorio. So documente detalhes desses itens aqui depois de validar no servidor.

## Stack operacional

- VPS Linux
- Docker Compose
- Postgres 16
- FastAPI
- Next.js
- Nginx
- GitHub Actions com runner self-hosted

## Local esperado no servidor

```bash
/home/frederico/HubFutebol
```

## Comandos de rotina

### Ver status

```bash
cd /home/frederico/HubFutebol
docker compose ps
```

### Ver healthcheck

```bash
curl -fsS http://127.0.0.1:8080/api/health
```

### Ver logs

```bash
docker compose logs --tail=100 api
docker compose logs --tail=100 web
docker compose logs --tail=100 reverse-proxy
docker compose logs --tail=100 db
```

### Reiniciar servicos

```bash
docker compose restart
```

### Rebuild da aplicacao

```bash
docker compose up -d --build
```

## Deploy

O deploy automatico esta definido em `.github/workflows/deploy.yml`.

Fluxo atual:

1. push para `main`
2. runner no servidor faz `git reset --hard` para o commit novo
3. `docker compose up -d --build`
4. healthcheck local
5. rollback automatico se falhar

## Deploy manual seguro

Use apenas quando o fluxo automatico nao for a melhor opcao.

```bash
cd /home/frederico/HubFutebol
git status --short
git pull --ff-only
docker compose config >/tmp/hubfutebol-compose.rendered.yml
docker compose up -d --build
curl -fsS http://127.0.0.1:8080/api/health
```

## Banco de dados

### Abrir `psql`

```bash
docker compose exec db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### Backup manual

```bash
docker compose exec db sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```

### Restore manual

Atencao: sobrescreve dados.

```bash
docker compose exec -T db sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < backup.sql
```

## Checklist de incidente

1. Verificar `docker compose ps`
2. Testar `curl -fsS http://127.0.0.1:8080/api/health`
3. Ler logs do `api` e do `reverse-proxy`
4. Validar banco:

```bash
docker compose exec db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

5. Ver uso basico do servidor:

```bash
df -h
free -h
docker stats --no-stream
```

## Cuidados operacionais

- Nao expor portas publicas sem necessidade
- Nao commitar `.env`
- Nao executar limpeza destrutiva de Docker durante incidente sem necessidade clara
- Nao presumir que monitoramento e backup externos continuam validos sem checagem real
