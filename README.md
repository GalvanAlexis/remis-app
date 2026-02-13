# REMIS APP

Sistema P2P de transporte local - Mobile-first con React Native y NestJS

## 🚀 Stack Tecnológico (100% FREE)

### Backend

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT
- **Real-time**: Socket.io

### Mobile

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State**: Zustand + TanStack Query
- **UI**: React Native Paper

## 📁 Estructura del Proyecto

```
remis/
├── backend/          # NestJS API
├── mobile/           # React Native Expo app
├── docs/             # Documentación técnica
└── docker-compose.yml
```

## 🛠️ Setup Local

### Prerrequisitos

- Node.js 20+
- Docker & Docker Compose
- Git

### Instalación

1. **Clonar repositorio**

```bash
git clone <repo-url>
cd remis
```

2. **Backend**

```bash
cd backend
npm install
cp .env.example .env
docker-compose up -d  # PostgreSQL
npx prisma migrate dev
npm run start:dev
```

3. **Mobile**

```bash
cd mobile
npm install
npx expo start
```

## 📚 Documentación

Ver carpeta `/docs` para:

- Arquitectura técnica
- API endpoints
- Esquema de base de datos
- Guías de deployment

## 🔐 Variables de Entorno

### Backend (.env)

```
DATABASE_URL="postgresql://user:password@localhost:5432/remis"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Mobile (.env)

```
EXPO_PUBLIC_API_URL="http://localhost:3000/api/v1"
EXPO_PUBLIC_WS_URL="http://localhost:3000"
```

## 🚢 Deployment

- **Backend**: Render.com / Railway (free tier)
- **Database**: PostgreSQL incluido
- **Mobile**: Expo EAS Build

## 📝 Licencia

MIT
