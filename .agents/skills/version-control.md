---
name: version-control
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - git
  - commit
  - ci
  - docker
  - deploy
---

# Version Control — MySQL + Express

## Commits

- `feat(users): add search with LIKE query`
- `fix(db): add missing index on orders.user_id`
- `migration: add 003_create_orders table`

## CI Pipeline

```bash
npm ci
npx tsc --noEmit
npx biome check .
npx vitest run
npm run build
```

## Docker Compose

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DB_HOST: mysql
      DB_NAME: myapp
      DB_USER: root
      DB_PASSWORD: secret
    depends_on:
      mysql:
        condition: service_healthy

  mysql:
    image: mysql:8
    ports: ["3306:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: myapp
    healthcheck:
      test: mysqladmin ping -h localhost
      interval: 5s
      retries: 10
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

## .gitignore

```
node_modules/
dist/
.env
```

## Migrations CLI

```bash
npx tsx scripts/migrate.ts up     # Run pending
npx tsx scripts/migrate.ts down   # Rollback last
```
