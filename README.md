# NestJS Prisma Monorepo

A production-grade monorepo with Next.js frontend and NestJS backend, built with modern tools and best practices.

## 🚀 Features

- **Monorepo Architecture**: Turborepo + pnpm workspaces for efficient development
- **Frontend**: Next.js 14 with App Router, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: NestJS 10+ with Prisma ORM, PostgreSQL, JWT authentication
- **UI Components**: Reusable shadcn/ui components with Framer Motion animations
- **Authentication**: Complete auth system with 2FA, OAuth, and session management
- **Developer Experience**: ESLint, Prettier, Husky, lint-staged, commitlint
- **Type Safety**: Shared TypeScript types across frontend and backend
- **Testing**: Jest, Playwright, Supertest for comprehensive testing
- **Deployment**: Docker support with multi-stage builds

## 📦 Project Structure

```
.
├── apps/
│   ├── web/            # Next.js frontend
│   └── api/            # NestJS backend (existing)
├── packages/
│   ├── ui/             # Shared UI components (shadcn/ui)
│   ├── config/         # Environment configuration with Zod
│   ├── tsconfig/       # Shared TypeScript configurations
│   ├── eslint-config/  # Shared ESLint configurations
│   └── types/          # Shared TypeScript types
├── infra/
│   └── docker/         # Docker configurations
├── .github/workflows/  # CI/CD pipelines
└── turbo.json         # Turborepo configuration
```

## 🛠 Tech Stack

### Frontend (apps/web)

- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Theme**: Dark/Light mode support

### Backend (apps/api)

- **Framework**: NestJS 10+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Refresh tokens + 2FA
- **Security**: Helmet, CORS, Rate limiting
- **Documentation**: Swagger/OpenAPI
- **Logging**: Pino logger

### Shared Packages

- **UI**: Reusable React components with shadcn/ui
- **Types**: Shared TypeScript interfaces and types
- **Config**: Environment validation with Zod
- **ESLint Config**: Shared linting rules
- **TypeScript Config**: Shared compiler options

## 🚦 Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- pnpm 8.0 or higher
- PostgreSQL 15 or higher
- Docker (optional)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd nestjs-prisma-monorepo
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
# Copy example environment file
cp env.example .env

# Edit the .env file with your configuration
# Make sure to set DATABASE_URL and JWT secrets
```

4. **Set up the database**

```bash
# Run database migrations
pnpm db:migrate

# Seed the database (optional)
pnpm db:seed
```

5. **Start development servers**

```bash
# Start all applications in development mode
pnpm dev

# Or start specific applications
pnpm dev:web    # Frontend only
pnpm dev:api    # Backend only
```

The applications will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

## 📝 Available Scripts

### Root Level Commands

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps for production
pnpm start        # Start all apps in production mode
pnpm lint         # Lint all packages
pnpm test         # Run all tests
pnpm typecheck    # Type check all packages
pnpm format       # Format code with Prettier
pnpm clean        # Clean all build artifacts
```

### Package-Specific Commands

```bash
# Frontend (apps/web)
pnpm dev:web      # Start Next.js dev server
pnpm build:web    # Build Next.js app
pnpm start:web    # Start Next.js in production

# Backend (apps/api) - existing commands
pnpm dev:api      # Start NestJS dev server
pnpm build:api    # Build NestJS app
pnpm start:api    # Start NestJS in production
```

## 🐳 Docker Support

### Development with Docker Compose

```bash
# Start all services including PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build production images
docker build -f apps/web/Dockerfile -t web .
docker build -f apps/api/Dockerfile -t api .
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Frontend E2E tests (Playwright)
pnpm test:e2e:web

# Backend E2E tests (Supertest)
pnpm test:e2e:api
```

## 🔐 Authentication Features

The application includes a comprehensive authentication system:

- **User Registration/Login**: Email/password with validation
- **JWT Authentication**: Access + refresh token strategy
- **Two-Factor Authentication**: TOTP-based 2FA with QR codes
- **OAuth Integration**: Google and Facebook login
- **Session Management**: Track and manage user sessions
- **Password Security**: Argon2 hashing, strength validation
- **Email Verification**: Account activation via email
- **Password Reset**: Secure password recovery flow

## 🎨 UI Components

The monorepo includes a comprehensive UI library built on shadcn/ui:

- **Form Components**: Input, Button, Card, etc.
- **Navigation**: Header, Sidebar, Breadcrumbs
- **Data Display**: Tables, Lists, Stats cards
- **Feedback**: Toasts, Alerts, Loading states
- **Layout**: Responsive grids, containers
- **Animations**: Smooth transitions with Framer Motion

## 📊 Dashboard Features

- **User Management**: CRUD operations with inline editing
- **Analytics**: Usage statistics and metrics
- **Security**: Session monitoring, 2FA management
- **System Status**: Health checks and monitoring
- **Data Tables**: Sortable, filterable, with bulk actions

## 🔧 Configuration

### Environment Variables

All environment variables are validated using Zod schemas in `packages/config`. See `env.example` for all available options.

### Database Configuration

The application uses Prisma ORM with PostgreSQL. Database schema is defined in `prisma/schema.prisma`.

### Styling Configuration

TailwindCSS is configured with custom design tokens and dark mode support. The configuration supports the entire shadcn/ui component library.

## 🚀 Deployment

### Vercel (Frontend)

```bash
# Deploy Next.js app to Vercel
vercel --prod
```

### Railway/Render (Backend)

The NestJS backend can be deployed to any Node.js hosting platform. Make sure to:

1. Set all required environment variables
2. Run database migrations
3. Configure CORS for your frontend domain

### Docker Deployment

Use the provided Dockerfiles for containerized deployments:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [NestJS](https://nestjs.com/) - Node.js framework
- [Prisma](https://prisma.io/) - Database ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Turborepo](https://turbo.build/) - Monorepo tool
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

If you have any questions or need help with setup, please open an issue or reach out to the maintainers.

---

**Happy coding! 🎉**
