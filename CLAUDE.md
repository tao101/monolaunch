# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Monolaunch** is a CLI tool that sets up production-ready projects with Supabase integration configured for self-hosting on Coolify. It offers two main setup options:

1. **Next.js + Supabase**: A web application with Supabase backend configured for Coolify deployment
2. **Monorepo**: A pnpm workspace with Next.js web app, Expo mobile app, and shared TypeScript packages

The tool is built with TypeScript and uses the `@clack/prompts` library for interactive CLI prompts.

## Commands

### Development
- `npm run dev` - Run the CLI tool in development mode with file watching
- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm start` - Run the compiled CLI tool from `dist/index.js`

### Package Management
- Uses `pnpm` as the package manager (see `packageManager` field in package.json)
- `npm run prepublishOnly` - Automatically builds before publishing to npm

## Architecture

### Entry Point
- **index.ts**: Main CLI entry point that handles command-line arguments, interactive prompts, and delegates to generator functions
- Supports both CLI arguments (`-t`, `-a`, `-h`) and interactive prompts for configuration

### Core Modules
- **src/generators.ts**: Contains the main generator functions:
  - `createMonorepo()` - Creates pnpm monorepo with Next.js web app, Expo mobile app, shared packages, and Supabase backend
  - `createWebOnlyApp()` - Creates Next.js application with Supabase integration configured for Coolify deployment
- **src/utils.ts**: Utility functions including `detectPackageManager()` for automatic package manager detection

### Configuration Options
- **Architecture types**: `monorepo` (full-stack) or `nextjs-only` (web-only)
- **Template types**: `bare` (minimal setup) or `opinionated` (includes Zod, ShadCN, Legend State, ESLint, Prettier, etc.)

### Code Structure
- Uses ES modules (`"type": "module"` in package.json)
- TypeScript with strict configuration
- Outputs to `dist/` directory for distribution as npm package
- Binary is accessible as `monolaunch` command when installed

### Key Dependencies
- `@clack/prompts` - Interactive CLI prompts and logging
- Node.js built-in modules: `node:util` for argument parsing, `child_process` for executing shell commands

## Project Setup Requirements

### CLI Tools Used
- `npx create-next-app@latest` - Create Next.js applications
- `pnpm dlx shadcn@latest init` - Initialize ShadCN UI components
- `npx supabase init` - Initialize Supabase project
- `npx create-expo-app` - Create Expo applications (for monorepo option)

### Setup Specifications

#### Option 1: Next.js + Supabase
- Next.js app configured for Coolify deployment
- Complete ShadCN UI component installation (user should be prompted to add all components)
- Supabase integration with local development setup
- Deployment configuration for Coolify self-hosting

#### Option 2: Monorepo
- pnpm workspace configuration
- Next.js web app (same as Option 1)
- Expo mobile application
- Shared TypeScript packages for common utilities and types
- Cross-platform code sharing between web and mobile

### Development Guidelines
- Always use the latest versions of CLI tools
- Use Context7 to get up-to-date documentation for any setup requirements
- Ensure all generated projects are production-ready
- Configure projects for Coolify deployment from the start

### Development Notes
- Generator functions are currently placeholder implementations with console logging
- Package manager detection prioritizes pnpm > yarn > npm based on lock files and global availability
- The CLI executes external commands to create and configure projects using official tools
- alawys use pnpm in this project