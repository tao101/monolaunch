import { execSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync, readFileSync, unlinkSync, readdirSync } from "fs";
import { join, basename } from "path";

// Utility function to detect the user's default package manager
export function detectPackageManager(): "npm" | "yarn" | "pnpm" {
  // Check for lock files in current directory
  if (existsSync("pnpm-lock.yaml")) return "pnpm";
  if (existsSync("yarn.lock")) return "yarn";
  if (existsSync("package-lock.json")) return "npm";

  // Check for global package manager preferences
  try {
    // Check if pnpm is available and preferred
    execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch {
    try {
      // Check if yarn is available
      execSync("yarn --version", { stdio: "ignore" });
      return "yarn";
    } catch {
      // Default to npm (should always be available with Node.js)
      return "npm";
    }
  }
}

// Utility function to execute shell commands with proper error handling
export function runCommand(command: string, options?: { cwd?: string; silent?: boolean }): boolean {
  try {
    if (!options?.silent) {
      console.log(`  • Running: ${command}`);
    }
    
    execSync(command, {
      stdio: options?.silent ? "ignore" : "inherit",
      cwd: options?.cwd || process.cwd(),
    });
    
    return true;
  } catch (error) {
    console.error(`  • Error running command: ${command}`);
    if (error instanceof Error) {
      console.error(`  • ${error.message}`);
    }
    return false;
  }
}

// Setup Supabase in the project
export async function setupSupabase(projectPath: string): Promise<boolean> {
  console.log("🗄️  Setting up Supabase...");
  
  // Initialize Supabase
  if (!runCommand("npx supabase init", { cwd: projectPath })) {
    return false;
  }
  
  console.log("  • Supabase initialized successfully");
  return true;
}

// Setup ShadCN UI with component installation
export async function setupShadcn(projectPath: string, addAllComponents: boolean = true): Promise<boolean> {
  console.log("🎨 Setting up ShadCN UI...");
  
  // Initialize ShadCN
  if (!runCommand("pnpm dlx shadcn@latest init --yes --defaults", { cwd: projectPath })) {
    return false;
  }
  
  console.log("  • ShadCN UI initialized successfully");
  
  if (addAllComponents) {
    // Add all ShadCN components
    if (!runCommand("pnpm dlx shadcn@latest add --all --yes", { cwd: projectPath })) {
      console.log("  • Warning: Some components may not have been installed");
    } else {
      console.log("  • All ShadCN components installed successfully");
    }
  }
  
  return true;
}

// Create environment variables file
export function createEnvFile(projectPath: string, isExpoApp: boolean = false): void {
  if (isExpoApp) {
    const envContent = `# Supabase Configuration for Expo
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For local development with physical device, use your machine's IP
# EXPO_PUBLIC_SUPABASE_URL=http://192.168.x.x:54321
`;
    
    writeFileSync(join(projectPath, ".env"), envContent);
    console.log("  • Expo environment variables file created");
  } else {
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URL for local development
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
`;

    writeFileSync(join(projectPath, ".env.local"), envContent);
    console.log("  • Next.js environment variables file created");
  }
}

// Create Supabase client utility
export function createSupabaseClient(projectPath: string, isExpoApp: boolean = false): void {
  // Create lib directory if it doesn't exist
  const libDir = join(projectPath, "lib");
  if (!existsSync(libDir)) {
    mkdirSync(libDir, { recursive: true });
  }

  if (isExpoApp) {
    // Create Expo/React Native Supabase client
    const expoClientContent = `import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});`;

    writeFileSync(join(libDir, "supabase.ts"), expoClientContent);
    console.log("  • Expo Supabase client created");
  } else {
    // Create Next.js Supabase clients (admin, browser, server)
    
    // 1. Admin Client (server-only)
    const adminClientContent = `import "server-only";

import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

export const supabaseAdminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);`;

    // 2. Browser Client
    const browserClientContent = `"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../types/supabase";

export const createSupabaseBrowserClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};`;

    // 3. Server Client
    const serverClientContent = `import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "../types/supabase";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, { ...options, path: "/" });
            });
          } catch (error) {
            console.error(
              "Error setting cookies probably was called from a server component",
              error
            );
          }
        },
      },
    }
  );
};`;

    // 4. Legacy client for backward compatibility
    const legacyClientContent = `// Legacy client for backward compatibility
// Use createSupabaseBrowserClient() for new code
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../types/supabase";

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);`;

    writeFileSync(join(libDir, "supabaseAdminClient.ts"), adminClientContent);
    writeFileSync(join(libDir, "supabaseBrowserClient.ts"), browserClientContent);
    writeFileSync(join(libDir, "supabaseServerClient.ts"), serverClientContent);
    writeFileSync(join(libDir, "supabase.ts"), legacyClientContent);
    
    console.log("  • Next.js Supabase clients created (admin, browser, server)");
  }
}

// Create Next.js middleware for session management
export function createNextjsMiddleware(projectPath: string): void {
  const middlewareContent = `import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "./types/supabase";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const currentPathname = request.nextUrl.pathname;
    
    // Skip middleware for API routes and auth callbacks
    if (
      currentPathname.startsWith("/api") ||
      currentPathname.startsWith("/auth") ||
      currentPathname.startsWith("/_next") ||
      currentPathname.startsWith("/favicon")
    ) {
      return response;
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if it exists
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Add your route protection logic here
    // Example:
    // const protectedRoutes = ['/dashboard', '/profile'];
    // const publicRoutes = ['/', '/login', '/signup'];
    // 
    // if (protectedRoutes.some(route => currentPathname.startsWith(route))) {
    //   if (!user) {
    //     return NextResponse.redirect(new URL('/login', request.url));
    //   }
    // }
    //
    // if (publicRoutes.some(route => currentPathname === route) && user) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }

    return response;
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

// Main middleware function
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};`;

  writeFileSync(join(projectPath, "middleware.ts"), middlewareContent);
  console.log("  • Next.js middleware created");
}

// Create Coolify deployment configuration
export function createCoolifyConfig(projectPath: string, appName: string): void {
  const coolifyReadmeContent = `# Coolify Deployment Guide

This project is configured for deployment with Coolify. Here's how to set it up:

## Manual Deployment Steps:

1. **Create a new application in Coolify**
   - Choose "Next.js" as the application type
   - Set the build command: \`pnpm build\`
   - Set the start command: \`pnpm start\`
   - Expose port: \`3000\`

2. **Environment Variables**
   Set these environment variables in your Coolify application:
   \`\`\`
   NODE_ENV=production
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=your-postgres-connection-string
   \`\`\`

3. **Supabase Setup**
   - Option A: Use managed Supabase (supabase.com)
   - Option B: Self-host Supabase using Coolify's one-click service

4. **Database Configuration**
   If using self-hosted Supabase:
   - Deploy Supabase service from Coolify's one-click services
   - Update your environment variables with the internal URLs

## Build Configuration

The project is configured with:
- Output: standalone (for optimal Docker deployment)
- TypeScript support
- Tailwind CSS
- ESLint
${appName.includes('shadcn') ? '- ShadCN UI components' : ''}

## Local Development

1. Start Supabase: \`supabase start\`
2. Install dependencies: \`pnpm install\`
3. Run development server: \`pnpm dev\`

## Production Deployment

The build process will create a \`.next\` directory with all necessary files for production deployment.
`;

  writeFileSync(join(projectPath, "COOLIFY_DEPLOYMENT.md"), coolifyReadmeContent);
  console.log("  • Coolify deployment guide created");
}

// Create pnpm workspace configuration
export function createPnpmWorkspace(projectPath: string): void {
  const workspaceContent = `packages:
  - 'apps/*'
  - 'packages/*'
`;

  const rootPackageJson = {
    name: "monorepo",
    private: true,
    version: "0.0.0",
    workspaces: ["apps/*", "packages/*"],
    scripts: {
      "dev": "pnpm run --parallel dev",
      "build": "pnpm run --recursive build",
      "lint": "pnpm run --recursive lint",
      "type-check": "pnpm run --recursive type-check"
    },
    devDependencies: {
      "typescript": "^5.0.0"
    }
  };

  // Create .npmrc for proper pnpm hoisting (required for Metro compatibility)
  const npmrcContent = `node-linker=hoisted
hoist-pattern[]=*expo*
hoist-pattern[]=*react-native*
hoist-pattern[]=*metro*`;

  writeFileSync(join(projectPath, "pnpm-workspace.yaml"), workspaceContent);
  writeFileSync(join(projectPath, "package.json"), JSON.stringify(rootPackageJson, null, 2));
  writeFileSync(join(projectPath, ".npmrc"), npmrcContent);
  console.log("  • pnpm workspace configuration created");
}

// Create shared package for monorepo
export function createSharedPackage(projectPath: string): void {
  const sharedDir = join(projectPath, "packages", "shared");
  const srcDir = join(sharedDir, "src");
  
  // Create directories
  mkdirSync(sharedDir, { recursive: true });
  mkdirSync(srcDir, { recursive: true });
  
  const packageJson = {
    name: "@monorepo/shared",
    version: "0.0.0",
    private: true,
    main: "dist/index.js",
    types: "dist/index.d.ts",
    exports: {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js",
        "require": "./dist/index.js"
      },
      "./types": {
        "types": "./dist/types.d.ts",
        "import": "./dist/types.js",
        "require": "./dist/types.js"
      },
      "./utils": {
        "types": "./dist/utils.d.ts",
        "import": "./dist/utils.js",
        "require": "./dist/utils.js"
      }
    },
    scripts: {
      "build": "tsc",
      "dev": "tsc --watch",
      "type-check": "tsc --noEmit"
    },
    devDependencies: {
      "typescript": "^5.0.0"
    }
  };
  
  const indexContent = `export * from './types';
export * from './utils';
`;
  
  const typesContent = `export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}
`;
  
  const utilsContent = `export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`;

  const tsconfigContent = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "node",
      declaration: true,
      declarationMap: true,
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      composite: true
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
  };
  
  writeFileSync(join(sharedDir, "package.json"), JSON.stringify(packageJson, null, 2));
  writeFileSync(join(srcDir, "index.ts"), indexContent);
  writeFileSync(join(srcDir, "types.ts"), typesContent);
  writeFileSync(join(srcDir, "utils.ts"), utilsContent);
  writeFileSync(join(sharedDir, "tsconfig.json"), JSON.stringify(tsconfigContent, null, 2));
  
  console.log("  • Shared package created");
}

// Configure Next.js for monorepo with shared packages
export function configureNextjsForMonorepo(nextjsPath: string): void {
  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@monorepo/shared'],
  serverExternalPackages: ['@supabase/supabase-js']
}

module.exports = nextConfig
`;

  const tsconfigContent = {
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [
        {
          name: "next"
        }
      ],
      baseUrl: ".",
      paths: {
        "@/*": ["./src/*"],
        "@monorepo/shared": ["../../packages/shared/src"],
        "@monorepo/shared/*": ["../../packages/shared/src/*"]
      },
      composite: true
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
    references: [
      { path: "../../packages/shared" }
    ]
  };

  writeFileSync(join(nextjsPath, 'next.config.js'), nextConfigContent);
  writeFileSync(join(nextjsPath, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2));
  
  console.log("  • Next.js configured for monorepo");
}

// Configure Expo for monorepo with shared packages
export function configureExpoForMonorepo(expoPath: string): void {
  const tsconfigContent = {
    extends: "expo/tsconfig.base",
    compilerOptions: {
      target: "esnext",
      module: "esnext",
      jsx: "react-native",
      lib: ["esnext"],
      moduleResolution: "node",
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      noEmit: true,
      isolatedModules: true,
      strict: true,
      baseUrl: ".",
      paths: {
        "@monorepo/shared": ["../../packages/shared/src"],
        "@monorepo/shared/*": ["../../packages/shared/src/*"],
        "@/*": ["./src/*"],
        "@/components/*": ["./src/components/*"]
      },
      composite: true
    },
    references: [
      { path: "../../packages/shared" }
    ]
  };

  writeFileSync(join(expoPath, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2));

  // Create Metro configuration for monorepo
  const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the workspace root for changes
config.watchFolders = [workspaceRoot];

// Configure node module resolution for workspace
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure proper platform extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;`;

  writeFileSync(join(expoPath, 'metro.config.js'), metroConfig);

  console.log("  • Expo configured for monorepo");
}

// Create root TypeScript configuration for monorepo
export function createRootTsConfig(projectPath: string): void {
  const tsconfigContent = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext", 
      moduleResolution: "node",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      baseUrl: ".",
      paths: {
        "@monorepo/shared": ["packages/shared/src"],
        "@monorepo/shared/*": ["packages/shared/src/*"]
      }
    },
    references: [
      { path: "./apps/web" },
      { path: "./apps/mobile" },
      { path: "./packages/shared" }
    ],
    files: [],
    include: []
  };

  writeFileSync(join(projectPath, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2));
  
  console.log("  • Root TypeScript configuration created");
}

// Create Supabase migration with user roles and auth setup
export function createSupabaseMigration(projectPath: string): boolean {
  console.log("📊 Creating default Supabase migration...");
  
  // Create migration using Supabase CLI
  if (!runCommand("npx supabase migration new initial_setup", { cwd: projectPath })) {
    console.error("  • Failed to create migration");
    return false;
  }
  
  // Find the created migration file
  const migrationsDir = join(projectPath, "supabase", "migrations");
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file: string) => file.includes('initial_setup.sql'))
    .sort()
    .reverse(); // Get the most recent one
  
  if (migrationFiles.length === 0) {
    console.error("  • Could not find created migration file");
    return false;
  }
  
  const migrationFile = join(migrationsDir, migrationFiles[0]!);
  
  const migrationContent = `-- Initial setup migration for user roles and authentication
-- This migration creates a comprehensive user management system with:
-- * User roles (admin/user) with Stripe integration
-- * Custom JWT claims through auth hooks
-- * Avatar storage with automatic cleanup
-- * Online status tracking and heartbeat system

-- Create app role enum
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
  id        bigint generated by default as identity primary key,
  user_id   uuid references auth.users on delete cascade not null unique,
  role      app_role not null default 'user',
  email     text not null,
  is_first_login boolean not null default true,
  username text,
  stripe_customer_id text,
  stripe_account_id text,
  is_stripe_account_active boolean not null default false,
  is_online boolean not null default false,
  unique (user_id, role),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
comment on table public.user_roles is 'Application roles for each user.';

-- Add moddatetime extension and trigger
create extension if not exists moddatetime schema extensions;
create trigger handle_updated_at before update on public.user_roles
  for each row execute procedure moddatetime('updated_at');

-- Grant necessary permissions
grant usage on schema public to postgres;
grant usage on schema public to supabase_auth_admin;
grant usage on schema public to service_role;

grant all on table public.user_roles to postgres;
grant all on table public.user_roles to supabase_auth_admin;
grant all on table public.user_roles to service_role;

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create user policy
create policy "Enable users to view their own data only"
on "public"."user_roles"
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

-- Enable realtime
alter publication supabase_realtime add table public.user_roles;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    first_name text;
    last_name text;
    base_username text;
    new_username text;
    random_num integer;
    username_exists boolean;
BEGIN
    -- Extract first and last name from full_name
    first_name := split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1);
    last_name := split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2);
    
    -- If last name is empty, use first name only
    IF last_name = '' THEN
        base_username := lower(first_name);
    ELSE
        base_username := lower(first_name) || '-' || lower(last_name);
    END IF;
    
    -- Generate unique username with random number
    LOOP
        -- Generate random 4-digit number
        random_num := floor(random() * 9000 + 1000)::integer;
        new_username := base_username || '-' || random_num::text;
        
        -- Check if username exists
        SELECT EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_roles.username = new_username
        ) INTO username_exists;
        
        -- Exit loop if username is unique
        EXIT WHEN NOT username_exists;
    END LOOP;
    
    -- Insert new user with generated username
    INSERT INTO public.user_roles (user_id, role, username, email)
    VALUES (NEW.id, 'user', new_username, NEW.email);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions on function
grant execute on function public.handle_new_user to postgres;
grant execute on function public.handle_new_user to supabase_auth_admin;
grant execute on function public.handle_new_user to service_role;

-- Custom access token hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  result_event jsonb;
  result_claims jsonb;
  user_role public.app_role;
  is_first_login boolean;
  input_user_id uuid;
  username text;
  stripe_customer_id text;
  stripe_account_id text;
  is_stripe_account_active boolean;
  is_online boolean;
  last_seen timestamp;
  
begin
  -- Make a deep copy of the event to avoid modifying it directly
  result_event := event;
  
  -- Get user_id
  input_user_id := (event->>'user_id')::uuid;
  
  -- Start with existing claims or empty object
  result_claims := coalesce(event->'claims', '{}'::jsonb);
  
  -- Get user data
  select 
    ur.role,
    ur.is_first_login,
    ur.username,
    ur.stripe_customer_id,
    ur.stripe_account_id,
    ur.is_stripe_account_active,
    ur.is_online,
    ur.updated_at
  into 
    user_role,
    is_first_login,
    username,
    stripe_customer_id,
    stripe_account_id,
    is_stripe_account_active,
    is_online,
    last_seen
  from public.user_roles ur
  where ur.user_id = input_user_id;
  
  -- Apply user data to claims
  if user_role is not null then
    -- Existing user with role
    result_claims := result_claims || jsonb_build_object(
      'user_role', user_role::text,
      'is_first_login', is_first_login,
      'username', username,
      'stripe_customer_id', stripe_customer_id,
      'stripe_account_id', stripe_account_id,
      'is_stripe_account_active', is_stripe_account_active,
      'is_online', is_online,
      'last_seen', last_seen
    );
    
    -- Update user metadata
    update auth.users
    set raw_user_meta_data = (
        case when raw_user_meta_data ? 'is_first_login' 
             then raw_user_meta_data - 'is_first_login' 
             else raw_user_meta_data 
        end
      ) || jsonb_build_object(
        'user_role', user_role::text,
        'is_first_login', is_first_login,
        'username', username,
        'stripe_customer_id', stripe_customer_id,
        'stripe_account_id', stripe_account_id,
        'is_stripe_account_active', is_stripe_account_active,
        'is_online', is_online,
        'last_seen', last_seen
      )
    where id = input_user_id;
  else
    -- New user, set defaults
    result_claims := result_claims || jsonb_build_object(
      'user_role', 'user',
      'is_first_login', true,
      'username', '',
      'stripe_customer_id', '',
      'stripe_account_id', '',
      'is_stripe_account_active', false,
      'is_online', false,
      'last_seen', now()
    );
    
    -- Set default values in metadata
    update auth.users
    set raw_user_meta_data = (
        case when raw_user_meta_data ? 'is_first_login' 
             then raw_user_meta_data - 'is_first_login' 
             else raw_user_meta_data 
        end
      ) || jsonb_build_object(
        'user_role', 'user',
        'is_first_login', true,
        'username', '',
        'stripe_customer_id', '',
        'stripe_account_id', '',
        'is_stripe_account_active', false,
        'is_online', false,
        'last_seen', now()
      )
    where id = input_user_id;
  end if;

  -- Set the modified claims back in the event
  result_event := jsonb_set(result_event, '{claims}', result_claims);
  
  return result_event;
end;
$$;

-- Grant permissions on hook function
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to postgres;
grant execute on function public.custom_access_token_hook to service_role;

grant usage on schema public to supabase_auth_admin;
grant usage on schema public to postgres;
grant usage on schema public to service_role;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

grant all
  on table public.user_roles
to supabase_auth_admin;

grant all
  on table public.user_roles
to postgres;

grant all
  on table public.user_roles
to service_role;

revoke all
  on table public.user_roles
  from authenticated, anon, public;

-- Handle role changes function
create or replace function public.handle_role_change()
returns trigger as $$
begin
  -- Update user metadata
  update auth.users
  set raw_user_meta_data = (
      case when raw_user_meta_data ? 'is_first_login' 
           then raw_user_meta_data - 'is_first_login' 
           else raw_user_meta_data 
      end
    ) || jsonb_build_object(
      'user_role', NEW.role::text,
      'is_first_login', NEW.is_first_login,
      'username', NEW.username,
      'stripe_customer_id', NEW.stripe_customer_id,
      'stripe_account_id', NEW.stripe_account_id,
      'is_stripe_account_active', NEW.is_stripe_account_active,
      'is_online', NEW.is_online
    ),
    updated_at = now()
  where id = NEW.user_id;

  -- Update refresh tokens
  update auth.refresh_tokens
  set updated_at = now(),
      created_at = now() - interval '1 year'
  where user_id = NEW.user_id::text;

  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for role changes
create trigger on_role_change
  after insert or update of role, is_first_login, username, stripe_customer_id, stripe_account_id, is_stripe_account_active, is_online on public.user_roles
  for each row
  execute function public.handle_role_change();

-- Create storage bucket for user avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 
  'user_avatars',
  'user_avatars',
  true,
  26214400, -- 25MB limit
  array['image/jpeg', 'image/png', 'image/webp']
where not exists (
  select 1 from storage.buckets where id = 'user_avatars'
);

-- Storage policies for user avatars
create policy "Users can upload their own avatar" on storage.objects for insert
with check (
  bucket_id = 'user_avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own avatar" on storage.objects for update
using (
  bucket_id = 'user_avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own avatar" on storage.objects for delete
using (
  bucket_id = 'user_avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to delete old avatars
create or replace function delete_old_avatar()
returns trigger as $$
declare
  old_avatar_path text;
begin
  if NEW.bucket_id != 'user_avatars' then
    return NEW;
  end if;

  select name into old_avatar_path 
  from storage.objects
  where bucket_id = 'user_avatars'
  and (storage.foldername(name))[1] = (storage.foldername(NEW.name))[1]
  and name != NEW.name
  and created_at < NEW.created_at;

  if old_avatar_path is not null then
    delete from storage.objects 
    where name = old_avatar_path;
  end if;

  return NEW;
exception
  when others then
    raise warning 'Error in delete_old_avatar: %', SQLERRM;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for avatar cleanup
create trigger on_avatar_upload
  after insert or update on storage.objects
  for each row
  when (NEW.bucket_id = 'user_avatars')
  execute function delete_old_avatar();

-- User heartbeat function
CREATE OR REPLACE FUNCTION public.user_heartbeat(user_uuid text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles
  SET
    updated_at = now(),
    is_online = true
  WHERE user_id = user_uuid::uuid;
END;
$$;

-- Profile completion check function
create or replace function public.check_profile_completion()
returns trigger as $$
declare
  bio text;
  avatar_url text;
begin
  bio := NEW.raw_user_meta_data->>'bio';
  avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  if bio is not null 
    and length(bio) > 3 
    and avatar_url is not null 
    and length(avatar_url) > 3 
  then
    update public.user_roles
    set is_first_login = false
    where user_id = NEW.id
    and is_first_login = true;
    
    update auth.users
    set raw_user_meta_data = (
        case when raw_user_meta_data ? 'is_first_login' 
             then raw_user_meta_data - 'is_first_login' 
             else raw_user_meta_data 
        end
      ) || jsonb_build_object(
        'is_first_login', false
      ),
      updated_at = now()
    where id = NEW.id
    and (raw_user_meta_data->>'is_first_login')::boolean = true;
  end if;

  return NEW;
exception
  when others then
    raise warning 'Error in check_profile_completion: %', SQLERRM;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for profile completion
create trigger on_profile_update
  after update of raw_user_meta_data on auth.users
  for each row
  execute function public.check_profile_completion();

-- Additional policies for admin access
create policy "Allow auth admin to update user roles"
on public.user_roles 
for update to supabase_auth_admin
using (true)
with check (true);

create policy "Allow auth admin to read user roles" ON public.user_roles
as permissive for select
to supabase_auth_admin
using (true);

-- Final permission grants
grant update on public.user_roles to postgres;
grant update on public.user_roles to supabase_auth_admin;
grant update on public.user_roles to supabase_auth_admin;
`;
  
  // Write the migration content
  writeFileSync(migrationFile, migrationContent);
  console.log("  • Migration created successfully");
  
  return true;
}

// Update Supabase config.toml with auth settings
export function updateSupabaseConfig(projectPath: string): boolean {
  console.log("⚙️  Updating Supabase configuration...");
  
  const configPath = join(projectPath, "supabase", "config.toml");
  
  if (!existsSync(configPath)) {
    console.error("  • Config file not found");
    return false;
  }
  
  try {
    let configContent = readFileSync(configPath, 'utf-8');
    
    // Update site_url
    configContent = configContent.replace(
      /site_url = "[^"]*"/,
      'site_url = "http://localhost:3000"'
    );
    
    // Update additional_redirect_urls
    const redirectUrlsPattern = /additional_redirect_urls = \[[^\]]*\]/;
    const newRedirectUrls = 'additional_redirect_urls = ["http://localhost:3000", "http://localhost:3000/api/auth/v1/callback"]';
    
    if (redirectUrlsPattern.test(configContent)) {
      configContent = configContent.replace(redirectUrlsPattern, newRedirectUrls);
    } else {
      // Find [auth] section and add after site_url
      configContent = configContent.replace(
        /(\[auth\][^[]*site_url = "[^"]*")/,
        `$1\n${newRedirectUrls}`
      );
    }
    
    // Add or update custom access token hook
    const hookSection = `
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"`;
    
    if (configContent.includes('[auth.hook.custom_access_token]')) {
      // Replace existing hook section
      configContent = configContent.replace(
        /\[auth\.hook\.custom_access_token\][^[]*(?=\[|$)/,
        hookSection + '\n'
      );
    } else {
      // Add hook section at the end of [auth] section
      configContent = configContent.replace(
        /(\[auth\][^[]*)/,
        `$1${hookSection}\n`
      );
    }
    
    writeFileSync(configPath, configContent);
    console.log("  • Supabase config updated successfully");
    return true;
  } catch (error) {
    console.error("  • Error updating config:", error);
    return false;
  }
}

// Setup Supabase TypeScript type generation
export function setupSupabaseTypes(projectPath: string, isExpoApp: boolean = false): void {
  console.log("📝 Setting up Supabase TypeScript types...");
  
  // Create types directory
  const typesDir = join(projectPath, "types");
  if (!existsSync(typesDir)) {
    mkdirSync(typesDir, { recursive: true });
  }

  // Create initial database.types.ts with instructions
  const databaseTypesContent = `// Auto-generated TypeScript types from Supabase
// This file will be updated when you run the type generation script
//
// To generate types from your local Supabase database, run:
// ${isExpoApp ? 'npx expo run' : 'pnpm run'} db:types
//
// To generate types from a remote Supabase project, run:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // Your database tables will appear here after running type generation
      // Example:
      // users: {
      //   Row: {
      //     id: string
      //     email: string
      //     created_at: string
      //   }
      //   Insert: {
      //     id?: string
      //     email: string
      //     created_at?: string
      //   }
      //   Update: {
      //     id?: string
      //     email?: string
      //     created_at?: string
      //   }
      // }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database["public"]["Enums"])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]]["Enums"])
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]]["Enums"])[EnumName]
  : PublicEnumNameOrOptions extends keyof (Database["public"]["Enums"])
  ? (Database["public"]["Enums"])[PublicEnumNameOrOptions]
  : never
`;

  writeFileSync(join(typesDir, "database.types.ts"), databaseTypesContent);
  console.log("  • Database types template created");
}

// Update package.json with useful development scripts
export function updatePackageJsonScripts(projectPath: string, isExpoApp: boolean = false, isMonorepoRoot: boolean = false): void {
  console.log("📦 Adding useful development scripts...");
  
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.log("  • package.json not found, skipping script updates");
    return;
  }
  
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  
  if (isMonorepoRoot) {
    // Monorepo root scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "dev": "pnpm run --parallel dev",
      "build": "pnpm run --recursive build",
      "start": "pnpm run --recursive start",
      "lint": "pnpm run --recursive lint",
      "lint:fix": "pnpm run --recursive lint:fix",
      "format": "pnpm run --recursive format",
      "format:check": "pnpm run --recursive format:check",
      "type-check": "pnpm run --recursive type-check",
      "test": "pnpm run --recursive test",
      "db:types": "cd apps/web && pnpm run db:types && cd ../mobile && pnpm run db:types",
      "db:reset": "cd apps/web && pnpm run db:reset",
      "db:migrate": "cd apps/web && pnpm run db:migrate",
      "supabase:start": "cd apps/web && pnpm run supabase:start",
      "supabase:stop": "cd apps/web && pnpm run supabase:stop",
      "supabase:status": "cd apps/web && pnpm run supabase:status"
    };
  } else if (isExpoApp) {
    // Expo/React Native scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "dev": "expo start",
      "start": "expo start",
      "android": "expo run:android",
      "ios": "expo run:ios",
      "web": "expo start --web",
      "prebuild": "expo prebuild",
      "prebuild:clean": "expo prebuild --clean",
      "test": "jest",
      "lint": "npx expo lint",
      "lint:fix": "npx expo lint --fix",
      "format": "prettier --write .",
      "format:check": "prettier --check .",
      "type-check": "tsc --noEmit",
      "db:types": "cd ../web && npx supabase gen types typescript --local > ../mobile/types/database.types.ts",
      "db:reset": "cd ../web && npx supabase db reset",
      "db:migrate": "cd ../web && npx supabase migration new",
      "supabase:start": "cd ../web && npx supabase start",
      "supabase:stop": "cd ../web && npx supabase stop",
      "supabase:status": "cd ../web && npx supabase status"
    };
  } else {
    // Next.js scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "format": "prettier --write .",
      "format:check": "prettier --check .",
      "type-check": "tsc --noEmit",
      "test": "jest",
      "test:watch": "jest --watch",
      "db:types": "npx supabase gen types typescript --local > types/database.types.ts",
      "db:reset": "npx supabase db reset",
      "db:migrate": "npx supabase migration new",
      "db:push": "npx supabase db push",
      "supabase:start": "npx supabase start",
      "supabase:stop": "npx supabase stop",
      "supabase:status": "npx supabase status"
    };
  }
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`  • ${isMonorepoRoot ? 'Monorepo' : isExpoApp ? 'Expo' : 'Next.js'} scripts added to package.json`);
}

// Create custom README.md for the project
export function createProjectReadme(projectPath: string, projectName: string, isMonorepo: boolean, templateType: "bare" | "opinionated"): void {
  console.log("📄 Creating custom project README...");
  
  const readmeContent = `# ${projectName}

${isMonorepo ? 'A modern full-stack monorepo' : 'A modern Next.js web application'} built with TypeScript, Supabase, and ${templateType === 'opinionated' ? 'comprehensive tooling' : 'minimal dependencies'}.

## 🚀 Tech Stack

${isMonorepo ? `### Web Application (Next.js)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS${templateType === 'opinionated' ? ' with ShadCN UI components' : ''}
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Package Manager**: PNPM

### Mobile Application (React Native + Expo)
- **Framework**: Expo with Expo Router
- **Language**: TypeScript
- **Styling**: ${templateType === 'opinionated' ? 'React Native Reusables with NativeWind' : 'React Native StyleSheet'}
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (shared with web app)
- **Package Manager**: NPM (via Expo)

### Shared Packages
- **TypeScript utilities** and **type definitions**
- **Shared constants** and **configurations**
` : `- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS${templateType === 'opinionated' ? ' with ShadCN UI components' : ''}
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Package Manager**: PNPM
`}${templateType === 'opinionated' ? `
### Additional Tools & Libraries
- **UI Components**: ${isMonorepo ? 'ShadCN UI (web) + React Native Reusables (mobile)' : 'ShadCN UI components'}
- **State Management**: Legend State v3 with Supabase integration
- **Schema Validation**: Zod
- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Authentication**: Supabase Auth with custom JWT claims
` : ''}
## 🏗️ Project Structure

${isMonorepo ? `\`\`\`
${projectName}/
├── apps/
│   ├── web/                 # Next.js web application
│   │   ├── src/
│   │   ├── supabase/        # Database migrations & config
│   │   ├── types/           # TypeScript type definitions
│   │   └── package.json
│   └── mobile/              # Expo React Native app
│       ├── app/             # Expo Router pages
│       ├── components/      # React Native components
│       ├── lib/             # Utilities and configurations
│       ├── types/           # TypeScript type definitions
│       └── package.json
├── packages/
│   └── shared/              # Shared TypeScript utilities
├── pnpm-workspace.yaml      # PNPM workspace configuration
└── package.json             # Workspace root package.json
\`\`\`
` : `\`\`\`
${projectName}/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components${templateType === 'opinionated' ? ' (including ShadCN UI)' : ''}
│   └── lib/                 # Utilities and configurations
├── supabase/                # Database migrations & config
├── types/                   # TypeScript type definitions
└── package.json
\`\`\`
`}
## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and ${isMonorepo ? 'PNPM' : 'PNPM'}
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Install Dependencies
\`\`\`bash
${isMonorepo ? 'pnpm install' : 'pnpm install'}
\`\`\`

### 2. Start Supabase
\`\`\`bash
${isMonorepo ? 'pnpm supabase:start' : 'pnpm supabase:start'}
\`\`\`

This will start the local Supabase stack and show you the local development URLs and keys.

### 3. Update Environment Variables
Copy the keys from the Supabase start output into your environment files:

${isMonorepo ? `- **Web app**: Update \`apps/web/.env.local\`
- **Mobile app**: Update \`apps/mobile/.env\`
` : `- Update \`.env.local\` with your Supabase credentials`}

### 4. Generate Database Types
\`\`\`bash
${isMonorepo ? 'pnpm db:types' : 'pnpm db:types'}
\`\`\`

### 5. Start Development Servers
${isMonorepo ? `\`\`\`bash
# Start both web and mobile apps
pnpm dev

# Or start individually:
cd apps/web && pnpm dev        # Web app at http://localhost:3000
cd apps/mobile && pnpm start  # Mobile app with Expo
\`\`\`
` : `\`\`\`bash
pnpm dev  # Starts at http://localhost:3000
\`\`\`
`}
## 📦 Available Scripts

${isMonorepo ? `### Root Level (Monorepo)
\`\`\`bash
pnpm dev              # Start all applications
pnpm build            # Build all applications
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages
pnpm test             # Run tests in all packages
pnpm db:types         # Generate types for all apps
pnpm db:reset         # Reset local database
pnpm supabase:start   # Start Supabase services
pnpm supabase:stop    # Stop Supabase services
\`\`\`

### Web App (\`apps/web\`)
\`\`\`bash
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler check
pnpm test             # Run Jest tests
pnpm db:types         # Generate Supabase types
\`\`\`

### Mobile App (\`apps/mobile\`)
\`\`\`bash
pnpm start            # Start Expo development server
pnpm android          # Run on Android
pnpm ios              # Run on iOS
pnpm web              # Run in web browser
pnpm prebuild         # Generate native projects
pnpm db:types         # Generate Supabase types
\`\`\`
` : `\`\`\`bash
pnpm dev              # Start Next.js development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler check
pnpm test             # Run Jest tests
pnpm db:types         # Generate Supabase types from local DB
pnpm db:reset         # Reset local Supabase database
pnpm db:migrate       # Create new database migration
pnpm supabase:start   # Start local Supabase services
pnpm supabase:stop    # Stop local Supabase services
\`\`\`
`}
## 🗄️ Database & Backend

This project uses **Supabase** for the backend, providing:
- **PostgreSQL database** with Row Level Security (RLS)
- **Authentication** with custom JWT claims and user roles
- **Real-time subscriptions** for live data updates
- **Auto-generated API** with full TypeScript support

### User Management System
The database includes a comprehensive user management system with:
- Custom user roles (user, admin, super_admin)
- User profiles with metadata
- Stripe integration for payments (optional)
- Online status tracking
- First login detection for onboarding

### Database Schema
Run \`pnpm db:types\` to generate TypeScript types from your database schema automatically.

## 🚢 Deployment

This project is configured for deployment on [Coolify](https://coolify.io/) - a self-hosted alternative to Vercel/Netlify.

### Deployment Steps
1. Check the \`COOLIFY_DEPLOYMENT.md\` file for detailed deployment instructions
2. Set up your production Supabase project
3. Configure environment variables in Coolify
4. Deploy using Git integration

${templateType === 'opinionated' ? `
## 🎨 UI Components & Styling

${isMonorepo ? `### Web App (ShadCN UI)
- Pre-installed with all ShadCN UI components
- Customizable design system with CSS variables
- Dark/light mode support
- Accessible and keyboard-friendly

### Mobile App (React Native Reusables)
- Cross-platform UI components with NativeWind
- Consistent styling with Tailwind CSS
- Platform-specific optimizations
- Theme support for iOS and Android
` : `### ShadCN UI Components
- Pre-installed with all ShadCN UI components
- Customizable design system with CSS variables
- Dark/light mode support
- Accessible and keyboard-friendly components
`}
### State Management
- **Legend State v3** for reactive state management
- **Supabase integration** for real-time data sync
- **Local persistence** with automatic hydration
- **Type-safe** state with TypeScript inference
` : ''}
## 🤖 AI Development Assistant

This project includes a \`CLAUDE.md\` file that provides context and guidance for AI coding assistants like Claude. The file contains:
- Project architecture overview
- Development patterns and best practices
- Database schema documentation
- Common commands and workflows

This makes it easier to get help from AI when developing your application.

## 🛠️ Created with Monolaunch

This project was scaffolded using [**Monolaunch**](https://github.com/taoufiqlotfi/monolaunch) - a powerful CLI tool for creating production-ready ${isMonorepo ? 'full-stack monorepos' : 'Next.js applications'} with modern tooling.

### Why Monolaunch?
- **Zero configuration** - works out of the box
- **Best practices** built-in
- **Production-ready** setup
- **AI-friendly** documentation
- **Self-hosted** deployment ready

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

---

**Happy coding!** 🚀

*For questions or support, check the project documentation or open an issue.*
`;

  writeFileSync(join(projectPath, "README.md"), readmeContent);
  console.log("  • Custom README.md created with project information");
}

// Create project-specific CLAUDE.md file
export function createProjectClaudeMd(projectPath: string, projectName: string, isMonorepo: boolean, templateType: "bare" | "opinionated"): void {
  console.log("📝 Creating CLAUDE.md file...");
  
  const claudeMdContent = `# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this ${isMonorepo ? 'monorepo' : 'Next.js'} project.

## Project Overview

**${projectName}** is a ${isMonorepo ? 'full-stack monorepo' : 'Next.js web application'} with Supabase backend integration${templateType === 'opinionated' ? ' and comprehensive UI components' : ''}. ${isMonorepo ? 'It includes both web (Next.js) and mobile (Expo) applications with shared TypeScript packages.' : 'It is configured for Coolify deployment with self-hosted Supabase.'}

## Architecture

${isMonorepo ? `### Monorepo Structure
- **apps/web**: Next.js application with Supabase integration
- **apps/mobile**: Expo React Native application
- **packages/shared**: Shared TypeScript utilities and types

### Workspace Commands
- \`pnpm dev\` - Start all applications in development mode
- \`pnpm build\` - Build all applications
- \`pnpm lint\` - Run linting across all packages
` : `### Next.js Application
- **Architecture**: App Router with TypeScript
- **Styling**: Tailwind CSS${templateType === 'opinionated' ? ' with ShadCN UI components' : ''}
- **Backend**: Supabase with custom auth system
- **Deployment**: Optimized for Coolify
`}

## Commands

### Development
${isMonorepo ? `- \`pnpm dev\` - Start all applications
- \`cd apps/web && pnpm dev\` - Start web app only (http://localhost:3000)
- \`cd apps/mobile && npx expo start\` - Start mobile app
` : `- \`pnpm dev\` - Start development server (http://localhost:3000)
- \`pnpm build\` - Build for production
- \`pnpm start\` - Start production server
`}
### Database & Auth
- \`supabase start\` - Start local Supabase stack
- \`supabase status\` - View local development credentials
- \`supabase db reset\` - Reset local database with fresh migrations
- \`supabase migration new <name>\` - Create new migration
- \`supabase db push\` - Push local changes to remote database

### Linting & Building
- \`pnpm lint\` - Run ESLint
- \`pnpm type-check\` - Run TypeScript checks

## Database Schema

### User Management System
The project includes a comprehensive user management system:

#### \`user_roles\` Table
- **id**: Primary key
- **user_id**: Reference to auth.users (UUID)
- **role**: Enum ('admin', 'user')
- **email**: User email
- **username**: Auto-generated unique username
- **is_first_login**: Boolean for onboarding flow
- **stripe_customer_id**: Stripe customer integration
- **stripe_account_id**: Stripe connected account
- **is_stripe_account_active**: Stripe account status
- **is_online**: Real-time online status
- **created_at/updated_at**: Timestamps

#### Key Features
- **Custom JWT Claims**: Role and user data automatically added to JWT tokens
- **Automatic Username Generation**: Unique usernames created from full name + random number
- **Avatar Storage**: Dedicated bucket with automatic old avatar cleanup
- **Online Status**: Real-time tracking with heartbeat system
- **First Login Detection**: Automatic detection when profile is completed
- **Stripe Ready**: Built-in Stripe customer and account integration

### Authentication Hooks
- **custom_access_token_hook**: Adds user role and metadata to JWT claims
- **handle_new_user**: Creates user_roles entry for new registrations
- **handle_role_change**: Updates JWT claims when user data changes

## Key Files

### Core Configuration
- \`supabase/config.toml\` - Supabase configuration with auth hooks
- \`supabase/migrations/\` - Database migrations
- \`.env.local\` - Environment variables (not committed)

### Application Code
${isMonorepo ? `- \`apps/web/lib/supabase.ts\` - Supabase client for web
- \`apps/mobile/lib/supabase.ts\` - Supabase client for mobile
- \`packages/shared/src/types.ts\` - Shared TypeScript types
- \`packages/shared/src/utils.ts\` - Shared utilities
` : `- \`lib/supabase.ts\` - Supabase client configuration
- \`src/app/\` - Next.js App Router pages and layouts
${templateType === 'opinionated' ? '- `components/ui/` - ShadCN UI components' : ''}
`}

## Authentication Flow

### JWT Claims Structure
\`\`\`typescript
{
  user_role: 'admin' | 'user',
  is_first_login: boolean,
  username: string,
  stripe_customer_id?: string,
  stripe_account_id?: string,
  is_stripe_account_active: boolean,
  is_online: boolean,
  last_seen: timestamp
}
\`\`\`

### User Registration Flow
1. User signs up through Supabase Auth
2. \`handle_new_user\` trigger creates \`user_roles\` entry
3. Username automatically generated from full name
4. Default role set to 'user'
5. JWT claims populated on next login

### First Login Detection
- \`is_first_login\` starts as \`true\`
- Automatically set to \`false\` when user completes profile (bio + avatar)
- Used for onboarding flows

## Development Patterns

### TypeScript Type Generation
Generate up-to-date TypeScript types from your database schema:

#### Automatic Generation (Recommended)
\`\`\`bash
${isMonorepo ? 'pnpm db:types  # Generates types for both web and mobile apps' : 'pnpm db:types  # Generates types/database.types.ts'}
\`\`\`

#### Manual Generation
\`\`\`bash
# From local database
npx supabase gen types typescript --local > types/database.types.ts

# From remote project (replace YOUR_PROJECT_ID)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
\`\`\`

#### Using Generated Types
Import the Database type in your Supabase clients:
\`\`\`typescript
import { Database } from '../types/database.types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(url, key)
\`\`\`

### Available Scripts
This project includes comprehensive npm scripts for development and deployment:

#### ${isMonorepo ? 'Monorepo Scripts' : 'Development Scripts'}
${isMonorepo ? `\`\`\`bash
# Root level commands
pnpm dev              # Start all applications in parallel
pnpm build            # Build all applications
pnpm lint             # Lint all packages  
pnpm type-check       # Type check all packages
pnpm test             # Run tests in all packages

# Database & Supabase
pnpm db:types         # Generate types for all apps
pnpm db:reset         # Reset local database
pnpm db:migrate       # Create new migration
pnpm supabase:start   # Start local Supabase services
pnpm supabase:stop    # Stop local Supabase services
pnpm supabase:status  # View local credentials
\`\`\`

#### Individual App Scripts
\`\`\`bash
# Web app (apps/web)
cd apps/web
pnpm dev              # Next.js development server
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # ESLint
pnpm type-check       # TypeScript check
pnpm test             # Jest tests

# Mobile app (apps/mobile)  
cd apps/mobile
pnpm start            # Expo development server
pnpm android          # Run on Android
pnpm ios              # Run on iOS
pnpm web              # Run in browser
pnpm prebuild         # Generate native code
pnpm prebuild:clean   # Clean prebuild
\`\`\`
` : `\`\`\`bash
# Development
pnpm dev              # Next.js development server
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # ESLint checking
pnpm type-check       # TypeScript compilation check
pnpm test             # Run Jest tests
pnpm test:watch       # Jest in watch mode

# Database & Supabase
pnpm db:types         # Generate TypeScript types
pnpm db:reset         # Reset local database  
pnpm db:migrate       # Create new migration
pnpm db:push          # Push changes to remote
pnpm supabase:start   # Start local services
pnpm supabase:stop    # Stop local services  
pnpm supabase:status  # View credentials
\`\`\`
`}

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admin functions use SECURITY DEFINER

### Real-time Features
- \`user_roles\` table enabled for real-time subscriptions
- Online status tracking with heartbeat function
- Automatic offline detection

## Environment Variables

### Required (.env.local)
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
\`\`\`

### Production Setup
- Update Supabase URLs to production values
- Set up Stripe keys if using payment features
- Configure custom domain in Supabase dashboard

## Deployment

### Coolify Deployment
1. Check \`COOLIFY_DEPLOYMENT.md\` for detailed instructions
2. Set environment variables in Coolify dashboard
3. Configure Supabase project (managed or self-hosted)

### Database Migrations
- Always test migrations locally first: \`supabase db reset\`
- Push to production: \`supabase db push\`
- Backup database before major migrations

## Common Tasks

### Adding New Migrations
\`\`\`bash
supabase migration new add_new_feature
# Edit the generated SQL file
supabase db reset # Test locally
\`\`\`

### User Role Management
\`\`\`sql
-- Update user role
UPDATE user_roles SET role = 'admin' WHERE user_id = 'user-uuid';

-- Check online users
SELECT username, is_online FROM user_roles WHERE is_online = true;
\`\`\`

### Adding New Tables
- Always enable RLS: \`alter table new_table enable row level security;\`
- Add appropriate policies for user access
- Consider adding to realtime if needed: \`alter publication supabase_realtime add table new_table;\`

${templateType === 'opinionated' ? `## UI Components

### ShadCN Integration
- All components installed and ready to use
- Custom theme configuration in \`tailwind.config.ts\`
- Component library in \`components/ui/\`

### State Management
- Legend State for reactive state management
- Zod for schema validation
- Built-in form validation patterns

` : ''}## Security Considerations

- RLS policies protect user data
- Auth hooks run with elevated privileges (SECURITY DEFINER)
- Service role key should never be exposed to client
- Regular security reviews of auth policies recommended

## Troubleshooting

### Common Issues
1. **Migration fails**: Check Supabase logs with \`supabase logs\`
2. **Auth not working**: Verify \`site_url\` and \`redirect_urls\` in config.toml
3. **JWT claims missing**: Ensure custom access token hook is enabled
4. **Types out of sync**: Regenerate with \`supabase gen types typescript --local\`

### Getting Help
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
${templateType === 'opinionated' ? '- ShadCN docs: https://ui.shadcn.com' : ''}
${isMonorepo ? '- Expo docs: https://docs.expo.dev' : ''}
`;

  writeFileSync(join(projectPath, "CLAUDE.md"), claudeMdContent);
  console.log("  • CLAUDE.md created successfully");
}

export function setupExpoRouter(projectPath: string): boolean {
  try {
    console.log("  • Installing Expo SDK 52 and dependencies");

    // Install the latest Expo SDK 52
    if (!runCommand("pnpm add expo@~52.0.0", { cwd: projectPath })) {
      throw new Error("Failed to install Expo SDK");
    }

    console.log("  • Installing Expo Router v5 and dependencies");

    // Install Expo Router v5 and required dependencies
    const installCmd = "npx expo install expo-router@latest react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar";
    if (!runCommand(installCmd, { cwd: projectPath })) {
      throw new Error("Failed to install Expo Router dependencies");
    }

    // Update package.json main entry point
    console.log("  • Configuring package.json entry point");
    const packageJsonPath = join(projectPath, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    packageJson.main = "expo-router/entry";
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Create app directory and layout
    console.log("  • Creating Expo Router file structure");
    runCommand("mkdir -p app", { cwd: projectPath });
    
    // Create root layout file
    const layoutContent = `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}`;
    writeFileSync(join(projectPath, 'app', '_layout.tsx'), layoutContent);

    // Create index screen
    const indexContent = `import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to your Expo app!</Text>
      <Text style={styles.subtitle}>This app was created with Monolaunch</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});`;
    writeFileSync(join(projectPath, 'app', 'index.tsx'), indexContent);

    // Update app.json with Expo Router plugin
    console.log("  • Updating app.json configuration");
    const appJsonPath = join(projectPath, 'app.json');
    if (existsSync(appJsonPath)) {
      const appJsonContent = readFileSync(appJsonPath, 'utf8');
      const appJson = JSON.parse(appJsonContent);
      
      if (!appJson.expo.plugins) {
        appJson.expo.plugins = [];
      }
      
      if (!appJson.expo.plugins.includes("expo-router")) {
        appJson.expo.plugins.push("expo-router");
      }
      
      // Add scheme for deep linking
      if (!appJson.expo.scheme) {
        appJson.expo.scheme = `${basename(projectPath)}-app`;
      }

      writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    }

    // Ensure babel.config.js exists and is properly configured
    console.log("  • Configuring Babel for Expo Router");
    const babelConfigPath = join(projectPath, 'babel.config.js');
    const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;
    writeFileSync(babelConfigPath, babelConfig);

    // Clean up old App.js/tsx if it exists (from blank template)
    const oldAppFiles = ['App.js', 'App.tsx'];
    oldAppFiles.forEach(file => {
      const filePath = join(projectPath, file);
      if (existsSync(filePath)) {
        console.log(`  • Removing old ${file} file`);
        unlinkSync(filePath);
      }
    });

    console.log("  • Expo Router setup completed successfully");
    return true;
  } catch (error) {
    console.error("Failed to setup Expo Router:", error);
    return false;
  }
}

export function setupReactNativeReusables(projectPath: string): boolean {
  try {
    console.log("  • Setting up React Native Reusables with CLI");

    // Try using the official CLI to add all components
    console.log("  • Installing all React Native Reusables components");
    if (runCommand("pnpm dlx @react-native-reusables/cli@latest add --all --yes", { cwd: projectPath })) {
      console.log("  • All React Native Reusables components installed successfully");
      return true;
    }

    console.log("  • CLI installation failed, setting up minimal fallback");

    // Fallback: Create minimal setup with essential dependencies
    const dependencies = [
      "nativewind@^4.0.1",
      "tailwindcss",
      "class-variance-authority",
      "clsx",
      "tailwind-merge"
    ];
    
    const installCmd = `npx expo install ${dependencies.join(' ')}`;
    if (!runCommand(installCmd, { cwd: projectPath })) {
      throw new Error("Failed to install minimal React Native Reusables dependencies");
    }

    // Create src/lib directory and utils
    const srcLibDir = join(projectPath, "src", "lib");
    if (!existsSync(srcLibDir)) {
      mkdirSync(srcLibDir, { recursive: true });
    }

    // Create utils.ts with cn function
    const utilsContent = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

    writeFileSync(join(srcLibDir, 'utils.ts'), utilsContent);

    // Create src/components/ui directory structure
    const srcDir = join(projectPath, "src");
    const componentsDir = join(srcDir, "components");
    const uiDir = join(componentsDir, "ui");
    if (!existsSync(uiDir)) {
      mkdirSync(uiDir, { recursive: true });
    }

    // Create basic collapsible component to fix the import error
    const collapsibleComponent = `import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({ children, className }: CollapsibleProps) {
  return (
    <View className={cn('', className)}>
      {children}
    </View>
  );
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function CollapsibleTrigger({ children, onPress, className }: CollapsibleTriggerProps) {
  return (
    <TouchableOpacity onPress={onPress} className={cn('', className)}>
      {children}
    </TouchableOpacity>
  );
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

export function CollapsibleContent({ children, isOpen = true, className }: CollapsibleContentProps) {
  if (!isOpen) return null;

  return (
    <View className={cn('', className)}>
      {children}
    </View>
  );
}`;

    writeFileSync(join(uiDir, 'collapsible.tsx'), collapsibleComponent);

    // Create basic tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};`;

    writeFileSync(join(projectPath, 'tailwind.config.js'), tailwindConfig);

    // Create global.css
    const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

    writeFileSync(join(projectPath, 'global.css'), globalCss);

    // Update babel.config.js
    const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
    ],
  };
};`;

    writeFileSync(join(projectPath, 'babel.config.js'), babelConfig);

    console.log("  • React Native Reusables minimal setup completed");
    return true;
  } catch (error) {
    console.error("Failed to setup React Native Reusables:", error);
    return false;
  }
}

export function setupLegendState(projectPath: string, isExpoApp: boolean = false): boolean {
  try {
    console.log("  • Setting up Legend State with Supabase auth integration");
    
    // Install Legend State dependencies
    // The main package contains all the submodules
    const baseDependencies = [
      "@legendapp/state",
      "uuid"
    ];
    
    // Additional dependencies for React Native (MMKV for persistence)
    const mobileDependencies = [
      "react-native-mmkv"
    ];
    
    const dependencies = [
      ...baseDependencies,
      ...(isExpoApp ? mobileDependencies : [])
    ];
    
    const installCmd = isExpoApp 
      ? `npx expo install ${dependencies.join(' ')}`
      : `pnpm add ${dependencies.join(' ')}`;
      
    if (!runCommand(installCmd, { cwd: projectPath })) {
      throw new Error("Failed to install Legend State dependencies");
    }

    // Create stores directory
    const storesDir = join(projectPath, "stores");
    if (!existsSync(storesDir)) {
      mkdirSync(storesDir, { recursive: true });
    }

    // Create user store with Supabase auth integration
    const userStoreContent = isExpoApp ? 
    // React Native version
    `import { observable } from '@legendapp/state';
import { syncedSupabase, configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

// Configure synced with MMKV persistence for React Native
configureSyncedSupabase({
  generateId: () => uuidv4(),
});

// User authentication state
export const user$ = observable<{
  profile: any | null;
  session: any | null;
  isLoading: boolean;
}>({
  profile: null,
  session: null,
  isLoading: true,
});

// User roles observable synced with Supabase
export const userRoles$ = observable(syncedSupabase({
  supabase,
  collection: 'user_roles',
  filter: (select) => select.eq('user_id', user$.profile?.id?.get()),
  actions: ['read', 'update'],
  realtime: { filter: \`user_id=eq.\${user$.profile?.id?.get()}\` },
  persist: { 
    name: 'userRoles',
    plugin: ObservablePersistMMKV,
    retrySync: true 
  },
  changesSince: 'last-sync'
}));

// Listen to Supabase auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  user$.session.set(session);
  
  if (session?.user) {
    user$.profile.set(session.user);
    user$.isLoading.set(false);
    
    // Trigger user roles sync when user logs in
    userRoles$.get();
  } else {
    user$.profile.set(null);
    user$.isLoading.set(false);
  }
});

// Initialize auth state
const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    user$.session.set(session);
    
    if (session?.user) {
      user$.profile.set(session.user);
      userRoles$.get(); // Start syncing user roles
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  } finally {
    user$.isLoading.set(false);
  }
};

// Auto-initialize
initializeAuth();

export default user$;` :
    // Web version
    `import { observable } from '@legendapp/state';
import { syncedSupabase, configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseBrowserClient } from '../lib/supabaseBrowserClient';
import type { Database } from '../types/supabase';

// Configure synced with local storage persistence for web
configureSyncedSupabase({
  generateId: () => uuidv4(),
});

// User authentication state
export const user$ = observable<{
  profile: any | null;
  session: any | null;
  isLoading: boolean;
}>({
  profile: null,
  session: null,
  isLoading: true,
});

// Initialize Supabase client
const supabase = createSupabaseBrowserClient();

// User roles observable synced with Supabase
export const userRoles$ = observable(syncedSupabase({
  supabase,
  collection: 'user_roles',
  filter: (select) => select.eq('user_id', user$.profile?.id?.get()),
  actions: ['read', 'update'],
  realtime: { filter: \`user_id=eq.\${user$.profile?.id?.get()}\` },
  persist: { 
    name: 'userRoles',
    plugin: ObservablePersistLocalStorage,
    retrySync: true 
  },
  changesSince: 'last-sync'
}));

// Listen to Supabase auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  user$.session.set(session);
  
  if (session?.user) {
    user$.profile.set(session.user);
    user$.isLoading.set(false);
    
    // Trigger user roles sync when user logs in
    userRoles$.get();
  } else {
    user$.profile.set(null);
    user$.isLoading.set(false);
  }
});

// Initialize auth state
const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    user$.session.set(session);
    
    if (session?.user) {
      user$.profile.set(session.user);
      userRoles$.get(); // Start syncing user roles
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  } finally {
    user$.isLoading.set(false);
  }
};

// Auto-initialize
initializeAuth();

export default user$;`;

    writeFileSync(join(storesDir, 'userStore.ts'), userStoreContent);

    // Create types directory if it doesn't exist
    const typesDir = join(projectPath, "types");
    if (!existsSync(typesDir)) {
      mkdirSync(typesDir, { recursive: true });
    }

    // Create placeholder supabase types file
    const supabaseTypesContent = `// This file is auto-generated by Supabase CLI
// Run: supabase gen types typescript --local > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user'
          email: string
          username: string
          is_first_login: boolean
          stripe_customer_id: string | null
          stripe_account_id: string | null
          is_stripe_account_active: boolean
          is_online: boolean
          created_at: string
          updated_at: string
          last_seen: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'admin' | 'user'
          email: string
          username: string
          is_first_login?: boolean
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          is_stripe_account_active?: boolean
          is_online?: boolean
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user'
          email?: string
          username?: string
          is_first_login?: boolean
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          is_stripe_account_active?: boolean
          is_online?: boolean
          created_at?: string
          updated_at?: string
          last_seen?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}`;

    writeFileSync(join(typesDir, 'supabase.ts'), supabaseTypesContent);

    console.log("  • Legend State setup completed successfully");
    return true;
  } catch (error) {
    console.error("Failed to setup Legend State:", error);
    return false;
  }
}

export function setupPrettierAndESLint(projectPath: string, isExpoApp: boolean = false): boolean {
  try {
    console.log("🎨 Setting up Prettier and ESLint...");

    if (isExpoApp) {
      // Setup for Expo/React Native
      console.log("  • Installing ESLint and Prettier dependencies for Expo");
      runCommand("npx expo install eslint eslint-config-expo prettier eslint-config-prettier eslint-plugin-prettier --dev", { cwd: projectPath });

      // Create .eslintrc.js for Expo
      const eslintConfig = `const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
    rules: {
      'prettier/prettier': 'error',
    },
  },
]);`;

      writeFileSync(join(projectPath, '.eslintrc.js'), eslintConfig);

    } else {
      // Setup for Next.js
      console.log("  • Installing ESLint and Prettier dependencies for Next.js");
      runCommand("pnpm add --save-dev eslint-config-prettier eslint-plugin-prettier prettier", { cwd: projectPath });

      // Create .eslintrc.js for Next.js
      const eslintConfig = `const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
    plugins: ['prettier'],
    rules: {
      'prettier/prettier': 'error',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  }),
];

module.exports = eslintConfig;`;

      writeFileSync(join(projectPath, '.eslintrc.js'), eslintConfig);
    }

    // Create .prettierrc for both
    const prettierConfig = {
      printWidth: 100,
      tabWidth: 2,
      singleQuote: true,
      trailingComma: 'es5',
      semi: true,
      bracketSameLine: false,
      bracketSpacing: true,
    };

    writeFileSync(join(projectPath, '.prettierrc'), JSON.stringify(prettierConfig, null, 2));

    // Create .prettierignore
    const prettierIgnore = `# Dependencies
node_modules/

# Build outputs
dist/
build/
.next/
.expo/

# Environment files
.env*

# Lock files
package-lock.json
yarn.lock
pnpm-lock.yaml

# Logs
*.log

# OS generated files
.DS_Store
Thumbs.db`;

    writeFileSync(join(projectPath, '.prettierignore'), prettierIgnore);

    // Create .eslintignore
    const eslintIgnore = `# Dependencies
node_modules/

# Build outputs
dist/
build/
.next/
.expo/

# Environment files
.env*

# Lock files
package-lock.json
yarn.lock
pnpm-lock.yaml

# Logs
*.log`;

    writeFileSync(join(projectPath, '.eslintignore'), eslintIgnore);

    console.log("  • ESLint and Prettier configuration files created");
    console.log("  • Prettier and ESLint setup completed successfully");
    return true;
  } catch (error) {
    console.error("Failed to setup Prettier and ESLint:", error);
    return false;
  }
}
