# lessSocial Backend

API do lessSocial feita com NestJS, Prisma e MySQL.

## Stack

- NestJS
- Prisma ORM
- MySQL
- JWT AccessToken + RefreshToken

## Requisitos

- Node.js 20+
- npm 10+
- MySQL 8+

## Variaveis de Ambiente

Crie `backend/.env` com:

```env
DATABASE_URL=mysql://root@127.0.0.1:3306/lesssocial
FRONTEND_URL=http://localhost:3000
JWT_ACCESS_SECRET=devAccessSecret
JWT_REFRESH_SECRET=devRefreshSecret
PORT=3002
```

`FRONTEND_URL` aceita mais de um dominio separado por virgula.

## Instalacao

Na raiz do monorepo:

```bash
npm install
```

## Banco de Dados

Gerar Prisma Client:

```bash
npm run prisma:generate --workspace backend
```

Aplicar migracoes:

```bash
npx prisma migrate deploy --schema backend/prisma/schema.prisma
```

Popular dados de exemplo:

```bash
npm run seed --workspace backend
```

## Rodar em Desenvolvimento

```bash
npm run dev:backend
```

API padrao:

`http://localhost:3002/api`

HealthCheck:

`GET /api/health`

## Build e Producao

Build:

```bash
npm run build --workspace backend
```

Start:

```bash
npm run start:prod --workspace backend
```

## Endpoints Principais

### Auth

- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Profiles

- `GET /api/profiles/search`
- `GET /api/profiles/suggestions`
- `GET /api/profiles/discover`
- `GET /api/profiles/:username`
- `PATCH /api/profiles/me`
- `PATCH /api/profiles/me/visibility`

### Feed

- `GET /api/feed`

### Posts e Comentarios

- `POST /api/posts`
- `GET /api/profiles/:username/posts`
- `GET /api/posts/:id`
- `PATCH /api/posts/:id`
- `GET /api/hashtags/:tag/posts`
- `GET /api/posts/:id/likes`
- `POST /api/posts/:id/likes`
- `DELETE /api/posts/:id/likes`
- `POST /api/posts/:id/comments`
- `POST /api/comments/:id/replies`
- `POST /api/comments/:id/likes`
- `PATCH /api/comments/:id`

### Friends

- `POST /api/friends/requests`
- `PATCH /api/friends/requests/:id`
- `DELETE /api/friends/:userId`

### Testimonials

- `POST /api/testimonials`
- `GET /api/profiles/:username/testimonials`
- `PATCH /api/testimonials/:id/accept`
- `PATCH /api/testimonials/:id/reject`

### Albums

- `POST /api/albums`
- `POST /api/albums/:id/items`
- `GET /api/profiles/:username/albums`

### Notifications

- `GET /api/notifications`

## Scripts Uteis

```bash
npm run lint --workspace backend
npm run typecheck --workspace backend
npm run test --workspace backend
```

## Deploy Rapido

1. Configure variaveis no provedor
2. Rode migracoes em producao
3. Suba aplicacao com `npm run start:prod --workspace backend`
4. Valide `GET /api/health`
