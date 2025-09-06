# 🚀 Monolaunch

**A powerful CLI tool for creating production-ready full-stack projects with modern tooling**

Monolaunch scaffolds complete applications with Next.js, React Native (Expo), Supabase backend, and comprehensive development setup - all configured for self-hosted deployment on Coolify.

[![npm version](https://badge.fury.io/js/monolaunch.svg)](https://www.npmjs.com/package/monolaunch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🏗️ **Two Project Architectures**
- **Next.js + Supabase**: Full-featured web application
- **Monorepo**: Next.js web app + Expo mobile app + shared packages

### 📦 **Two Template Options**
- **Bare**: Minimal setup with essential dependencies
- **Opinionated**: Complete setup with UI libraries, state management, and dev tools

### 🛠️ **What's Included**
- **Modern Tech Stack**: Next.js 15, Expo, TypeScript, Tailwind CSS
- **Backend Integration**: Supabase with custom auth system and migrations  
- **UI Components**: ShadCN UI (web) + React Native Reusables (mobile)
- **State Management**: Legend State v3 with Supabase sync
- **Type Safety**: Auto-generated TypeScript types from database
- **Development Tools**: ESLint, Prettier, comprehensive scripts
- **Deployment Ready**: Coolify configuration with deployment guides
- **AI-Friendly**: CLAUDE.md files for AI development assistance

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g monolaunch

# Or use directly with npx
npx monolaunch
```

### Create a Project

```bash
# Interactive mode (recommended)
monolaunch

# Command-line arguments
monolaunch my-app --template opinionated --architecture monorepo
```

### Options

- `--template` or `-t`: `bare` | `opinionated` (default: interactive)
- `--architecture` or `-a`: `monorepo` | `nextjs-only` (default: interactive)  
- `--help` or `-h`: Show help information
- `--version` or `-v`: Show version number
- `--quiet` or `-q`: Suppress output (no prompts, requires all options)
- `--force` or `-f`: Force overwrite existing directory
- `--verbose`: Show detailed output
- `--dry-run`: Show what would be created without actually creating

## 🏗️ Project Architectures

### Option 1: Next.js + Supabase
Perfect for web-first applications with modern React patterns.

**Generated Structure:**
```
my-app/
├── src/app/              # Next.js App Router
├── components/ui/        # ShadCN UI components (opinionated)
├── lib/                  # Utilities and configurations
├── supabase/             # Database migrations & config
├── types/                # Auto-generated TypeScript types
├── CLAUDE.md             # AI development guide
├── README.md             # Project documentation
└── COOLIFY_DEPLOYMENT.md # Deployment instructions
```

### Option 2: Monorepo (Full-Stack)
Complete solution with web, mobile, and shared packages.

**Generated Structure:**
```
my-app/
├── apps/
│   ├── web/              # Next.js application
│   │   ├── src/app/      # App Router pages
│   │   ├── components/   # React components + ShadCN UI
│   │   ├── supabase/     # Database setup
│   │   └── types/        # Generated types
│   └── mobile/           # Expo React Native app
│       ├── app/          # Expo Router navigation
│       ├── components/   # React Native Reusables (opinionated)
│       ├── lib/          # Mobile utilities
│       └── types/        # Generated types
├── packages/
│   └── shared/           # Shared utilities and types
├── pnpm-workspace.yaml   # Workspace configuration
└── package.json          # Root package with workspace scripts
```

## 🧰 Template Types

### Bare Template
Minimal, lightweight setup with essential dependencies only.
- Next.js + TypeScript + Tailwind CSS
- Supabase integration with auth
- Basic development scripts

### Opinionated Template  
Complete development environment with modern tooling.
- **UI Libraries**: ShadCN UI + React Native Reusables
- **State Management**: Legend State v3 with Supabase sync
- **Schema Validation**: Zod for type-safe data validation
- **Code Quality**: ESLint + Prettier configuration
- **Type Generation**: Automated Supabase type generation
- **Testing Setup**: Jest configuration ready

## 🗄️ Database & Backend

### Supabase Integration
- **PostgreSQL** with Row Level Security (RLS)
- **Authentication** with custom JWT claims and user roles  
- **Real-time subscriptions** for live data updates
- **Auto-generated TypeScript types** from database schema

### Pre-built User Management
- Custom user roles (user, admin, super_admin)
- User profiles with metadata and avatars
- Stripe integration scaffolding for payments
- Online status tracking with real-time updates
- First-login detection for onboarding flows

### Database Scripts
```bash
pnpm db:types         # Generate TypeScript types
pnpm db:reset         # Reset local database
pnpm db:migrate       # Create new migration  
pnpm supabase:start   # Start local Supabase
pnpm supabase:stop    # Stop local services
```

## 📱 Mobile Development (Monorepo)

### Expo with Modern Navigation
- **Expo Router**: File-based routing system
- **React Native Reusables**: Cross-platform UI components
- **NativeWind**: Tailwind CSS for React Native
- **Shared Backend**: Same Supabase instance as web app

### Mobile-Specific Features
- Platform-optimized Supabase client
- MMKV persistence for Legend State
- Gesture handler integration
- Theme support (iOS/Android)

## 🚢 Deployment

### Coolify Ready
Every generated project includes:
- **Coolify configuration** files
- **Environment variable** templates  
- **Deployment guides** with step-by-step instructions
- **Docker-free setup** for simple deployment

### Deployment Options
- **Web App**: Deployed as standalone Next.js application
- **Mobile App**: Built with Expo Application Services (EAS)
- **Database**: Self-hosted Supabase or managed Supabase Cloud

## 🤖 AI Development Assistant

### CLAUDE.md Integration
Every project includes comprehensive AI guidance:
- Project architecture overview
- Database schema documentation  
- Development patterns and workflows
- Available scripts and commands
- Testing and deployment instructions

This makes it easy to get contextual help from AI assistants during development.

## 📚 Available Scripts

### Web Application
```bash
pnpm dev              # Start development server
pnpm build            # Build for production  
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript compilation check
pnpm test             # Run Jest tests
```

### Mobile Application (Monorepo)
```bash
pnpm start            # Start Expo development server
pnpm android          # Run on Android device/emulator
pnpm ios              # Run on iOS device/simulator  
pnpm web              # Run in web browser
pnpm prebuild         # Generate native projects
```

### Monorepo Workspace
```bash  
pnpm dev              # Start all applications
pnpm build            # Build all applications
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages
pnpm test             # Run tests across workspace
```

## 🏃‍♂️ Development Workflow

1. **Create Project**: `monolaunch my-app --template opinionated`
2. **Start Supabase**: `pnpm supabase:start`  
3. **Update Environment**: Copy Supabase keys to `.env.local`
4. **Generate Types**: `pnpm db:types`
5. **Start Development**: `pnpm dev`
6. **Build & Deploy**: Follow `COOLIFY_DEPLOYMENT.md`

## 🔧 Requirements

- **Node.js** 18.0.0 or higher
- **PNPM** (automatically detected and used)
- **Supabase CLI** for database management

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit changes**: `git commit -m 'Add amazing feature'`  
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Setup
```bash
# Clone the repository
git clone https://github.com/taoufiqlotfi/monolaunch.git
cd monolaunch

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build and test
pnpm build
npm start test-project
```

## 📋 Roadmap

- [ ] **Additional Templates**: Vue.js, SvelteKit, Nuxt.js options
- [ ] **Database Options**: PostgreSQL, MySQL, SQLite support
- [ ] **Deployment Targets**: Vercel, Netlify, Railway integrations
- [ ] **Mobile Frameworks**: Flutter, Ionic alternatives  
- [ ] **Testing Templates**: Playwright, Cypress, Vitest setups
- [ ] **CI/CD Integration**: GitHub Actions, GitLab CI templates

## ❓ FAQ

**Q: Can I use this with existing projects?**
A: Monolaunch is designed for new projects. For existing projects, you can manually adopt patterns from the generated code.

**Q: Do I need Docker for deployment?**  
A: No! Monolaunch generates projects configured for Coolify's Docker-free deployment.

**Q: Can I customize the generated templates?**
A: Yes! All generated code is standard TypeScript/React that you can modify as needed.

**Q: Is the generated code production-ready?**
A: Absolutely! Every generated project includes production optimizations, security best practices, and deployment configurations.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the incredible React framework
- [Expo](https://expo.dev/) for React Native development tools
- [Supabase](https://supabase.com/) for the backend-as-a-service platform
- [ShadCN UI](https://ui.shadcn.com/) for beautiful React components
- [Coolify](https://coolify.io/) for self-hosted deployment solution
- [Legend State](https://legendapp.com/open-source/state/) for reactive state management

---

**Built with ❤️ for the modern web development community**

*Happy coding! 🚀*