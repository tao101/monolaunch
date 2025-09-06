# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-09-06

### ✨ Added
- **Standard CLI Flags**: Added common CLI arguments expected in professional tools
  - `--version` / `-v`: Show version number
  - `--quiet` / `-q`: Suppress output and disable interactive prompts
  - `--verbose`: Show detailed output during operations
  - `--force` / `-f`: Force overwrite existing directories
  - `--dry-run`: Preview what would be created without actually creating files
- **Enhanced Help**: Improved help text with all available options
- **Directory Validation**: Check for existing directories with force override option
- **Quiet Mode**: Non-interactive mode for CI/CD and scripting
- **Dry-run Mode**: Safe preview of project structure before creation

### 🔄 Changed
- **Help System**: Enhanced help output with better formatting and all options listed
- **Error Handling**: Improved error messages and validation for all modes
- **Package Information**: Updated with complete npm metadata and repository links

### 🧪 Testing
- **Enhanced Test Suite**: Updated test scripts to cover all new CLI flags
- **Quick Test**: Improved `npm run test:quick` to validate core functionality

## [1.0.0] - 2024-09-06

### 🎉 Initial Release

### Added
- **CLI Tool**: Interactive command-line interface with argument support
- **Two Architecture Options**:
  - Next.js + Supabase web application
  - Full-stack monorepo with Next.js web app + Expo mobile app
- **Two Template Types**:
  - Bare: Minimal setup with essential dependencies
  - Opinionated: Complete setup with UI libraries and dev tools
- **Supabase Integration**:
  - PostgreSQL database with Row Level Security (RLS)
  - Custom authentication system with JWT claims
  - User management with roles and profiles
  - Real-time subscriptions
  - Auto-generated TypeScript types
- **UI Component Libraries**:
  - ShadCN UI for Next.js applications
  - React Native Reusables with NativeWind for Expo apps
- **State Management**:
  - Legend State v3 with Supabase integration
  - Reactive stores with automatic persistence
- **Development Experience**:
  - Comprehensive npm/pnpm scripts for all development tasks
  - TypeScript type generation from database schema
  - ESLint and Prettier configuration
  - Jest testing setup
- **Deployment Ready**:
  - Coolify configuration files
  - Deployment guides and documentation
  - Production-optimized builds
- **AI Development Assistant**:
  - CLAUDE.md files with project context
  - Database schema documentation
  - Development patterns and workflows
- **Mobile Development** (Monorepo):
  - Expo with Expo Router navigation
  - Cross-platform UI components
  - Shared backend with web application
  - Platform-specific optimizations

### Technical Details
- **Languages**: TypeScript, JavaScript
- **Frameworks**: Next.js 15, Expo, React, React Native
- **Styling**: Tailwind CSS, NativeWind
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Package Manager**: PNPM with workspace support
- **Build Tool**: TypeScript compiler
- **CLI Framework**: @clack/prompts

### Files Structure
```
monolaunch/
├── src/
│   ├── generators.ts         # Project generation logic
│   ├── utils.ts             # Utility functions
│   └── index.ts             # CLI entry point
├── dist/                    # Compiled JavaScript
├── README.md                # Project documentation
├── CHANGELOG.md             # This file
├── LICENSE                  # MIT License
└── package.json             # Package configuration
```

### Package Information
- **Name**: monolaunch
- **Version**: 1.0.0
- **License**: MIT
- **Repository**: https://github.com/taoufiqlotfi/monolaunch
- **Keywords**: cli, nextjs, react-native, expo, supabase, typescript, monorepo, fullstack