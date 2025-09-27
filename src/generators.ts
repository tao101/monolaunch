import { execSync } from "child_process";
import { join } from "path";
import { writeFileSync } from "fs";
import { confirm } from "@clack/prompts";
import { 
  detectPackageManager, 
  runCommand, 
  setupSupabase, 
  setupShadcn, 
  createEnvFile, 
  createSupabaseClient,
  createCoolifyConfig,
  createPnpmWorkspace,
  createSharedPackage,
  createSupabaseMigration,
  updateSupabaseConfig,
  createProjectClaudeMd,
  setupExpoRouter,
  createNextjsMiddleware,
  setupReactNativeReusables,
  setupLegendState,
  setupSupabaseTypes,
  updatePackageJsonScripts,
  createProjectReadme,
  setupPrettierAndESLint,
  configureNextjsForMonorepo,
  configureExpoForMonorepo,
  createRootTsConfig
} from "./utils.js";

export async function createMonorepo(
  appName: string,
  templateType: "bare" | "opinionated",
  options: { verbose?: boolean; quiet?: boolean; force?: boolean } = {}
) {
  console.log(`🏗️  Creating monorepo: ${appName}`);
  console.log(`📦 Template type: ${templateType}`);
  console.log("");

  const projectPath = join(process.cwd(), appName);

  // Create project directory
  if (!runCommand(`mkdir -p ${appName}`)) {
    throw new Error("Failed to create project directory");
  }

  process.chdir(appName);

  console.log("📁 Creating workspace structure...");
  createPnpmWorkspace(projectPath);
  createSharedPackage(projectPath);
  
  // Create root TypeScript configuration
  console.log("  • Setting up root TypeScript configuration");
  createRootTsConfig(projectPath);

  // Create apps directories
  runCommand("mkdir -p apps/web apps/mobile");

  console.log("🌐 Setting up Next.js web app...");
  const webAppPath = join(projectPath, "apps", "web");
  
  // Create Next.js app in web directory
  if (!runCommand(`npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes`)) {
    throw new Error("Failed to create Next.js app");
  }

  // Setup Supabase for web app
  await setupSupabase(webAppPath);
  
  if (templateType === "opinionated") {
    console.log("  • Setting up ShadCN UI components");
    await setupShadcn(webAppPath, true);
    
    console.log("  • Installing additional dependencies");
    runCommand("pnpm add zod @supabase/supabase-js @supabase/ssr server-only", { cwd: webAppPath });
  } else {
    console.log("  • Installing basic Supabase dependencies");
    runCommand("pnpm add @supabase/supabase-js @supabase/ssr server-only", { cwd: webAppPath });
  }

  // Create environment files and client for Next.js
  createEnvFile(webAppPath, false); // false = Next.js app
  createSupabaseClient(webAppPath, false); // false = Next.js app
  createNextjsMiddleware(webAppPath);
  setupSupabaseTypes(webAppPath, false); // false = Next.js app
  
  if (templateType === "opinionated") {
    console.log("  • Setting up Legend State store");
    setupLegendState(webAppPath, false); // false = Next.js app
    
    console.log("  • Setting up Prettier and ESLint");
    setupPrettierAndESLint(webAppPath, false); // false = Next.js app
  }

  // Configure Next.js for monorepo TypeScript imports
  console.log("  • Configuring Next.js for monorepo");
  configureNextjsForMonorepo(webAppPath);

  console.log("📱 Setting up React Native Expo app...");
  const mobileAppPath = join(projectPath, "apps", "mobile");
  
  // Create Expo app with basic setup
  if (!runCommand(`npx create-expo-app@latest mobile --no-install`, { cwd: join(projectPath, "apps") })) {
    throw new Error("Failed to create Expo app");
  }

  // Setup Expo Router for proper navigation
  console.log("🧭 Setting up Expo Router navigation...");
  if (!setupExpoRouter(mobileAppPath)) {
    throw new Error("Failed to setup Expo Router");
  }

  // Install Supabase for mobile
  console.log("  • Installing Supabase dependencies");
  runCommand("npx expo install @supabase/supabase-js @react-native-async-storage/async-storage", { cwd: mobileAppPath });

  if (templateType === "opinionated") {
    console.log("  • Setting up React Native Reusables");
    setupReactNativeReusables(mobileAppPath);
    
    console.log("  • Adding gesture handler for navigation");
    runCommand("npx expo install react-native-gesture-handler", { cwd: mobileAppPath });
    
    console.log("  • Installing Zod for schema validation");
    runCommand("npx expo install zod", { cwd: mobileAppPath });
  }

  console.log("🗄️  Setting up Supabase integration...");
  await setupSupabase(mobileAppPath);
  createEnvFile(mobileAppPath, true); // true = Expo app
  createSupabaseClient(mobileAppPath, true); // true = Expo app
  setupSupabaseTypes(mobileAppPath, true); // true = Expo app
  
  if (templateType === "opinionated") {
    console.log("  • Setting up Legend State store");
    setupLegendState(mobileAppPath, true); // true = Expo app
    
    console.log("  • Setting up Prettier and ESLint");
    setupPrettierAndESLint(mobileAppPath, true); // true = Expo app
  }

  // Configure Expo for monorepo TypeScript imports
  console.log("  • Configuring Expo for monorepo");
  configureExpoForMonorepo(mobileAppPath);

  console.log("📦 Installing workspace dependencies...");
  runCommand("pnpm install", { cwd: projectPath });

  // Create default migration and update config
  console.log("🔄 Creating default Supabase migration...");
  if (createSupabaseMigration(webAppPath)) {
    console.log("  • Migration created successfully");
  }
  
  console.log("⚙️  Updating Supabase configuration...");
  if (updateSupabaseConfig(webAppPath)) {
    console.log("  • Configuration updated successfully");
  }

  // Create Coolify configuration at root
  createCoolifyConfig(projectPath, appName);

  // Update package.json files with useful scripts
  console.log("📦 Setting up development scripts...");
  updatePackageJsonScripts(projectPath, false, true); // Monorepo root
  updatePackageJsonScripts(webAppPath, false, false); // Next.js app
  updatePackageJsonScripts(mobileAppPath, true, false); // Expo app

  // Create custom README
  createProjectReadme(projectPath, appName, true, templateType);

  // Create CLAUDE.md for AI assistance
  console.log("📝 Creating CLAUDE.md for AI assistance...");
  createProjectClaudeMd(projectPath, appName, true, templateType);

  console.log(`✅ Monorepo ${appName} created successfully!`);
  console.log("");
  console.log("🚀 Next steps:");
  console.log("  1. Start Supabase locally: supabase start");
  console.log("  2. Run the web app: cd apps/web && pnpm dev");
  console.log("  3. Run the mobile app: cd apps/mobile && npx expo start");
  console.log("  4. Check COOLIFY_DEPLOYMENT.md for deployment instructions");
}

export async function createWebOnlyApp(
  appName: string,
  templateType: "bare" | "opinionated",
  options: { verbose?: boolean; quiet?: boolean; force?: boolean } = {}
) {
  console.log(`🌐 Creating web app: ${appName}`);
  console.log(`📦 Template type: ${templateType}`);
  console.log("");

  const packageManager = detectPackageManager();
  console.log(`📦 Detected package manager: ${packageManager}`);
  console.log("");

  console.log("🌐 Setting up Next.js web app...");

  try {
    // Create Next.js app with all modern defaults
    const createCommand = `npx create-next-app@latest ${appName} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes`;
    console.log(`  • Running: ${createCommand}`);

    execSync(createCommand, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log(`  • Next.js app created successfully in ./${appName}`);

    // Change working directory to the newly created app folder
    process.chdir(appName);
  } catch (error) {
    console.error("  • Error creating Next.js app:", error);
    throw error;
  }

  const projectPath = process.cwd();

  // Setup Supabase
  await setupSupabase(projectPath);
  
  // Install Supabase dependencies
  console.log("  • Installing Supabase dependencies");
  if (!runCommand("pnpm add @supabase/supabase-js @supabase/ssr server-only")) {
    throw new Error("Failed to install Supabase dependencies");
  }

  if (templateType === "opinionated") {
    // Ask user if they want to install all ShadCN components
    const addAllComponents = await confirm({
      message: "Would you like to add all ShadCN UI components?",
      initialValue: true
    });

    if (addAllComponents) {
      console.log("  • Setting up ShadCN UI with all components");
      await setupShadcn(projectPath, true);
    } else {
      console.log("  • Setting up ShadCN UI (you can add components later)");
      await setupShadcn(projectPath, false);
    }

    console.log("  • Installing additional dependencies");
    runCommand("pnpm add zod");
  }

  console.log("🗄️  Setting up Supabase integration...");
  createEnvFile(projectPath, false); // false = Next.js app
  createSupabaseClient(projectPath, false); // false = Next.js app
  createNextjsMiddleware(projectPath);
  setupSupabaseTypes(projectPath, false); // false = Next.js app
  
  if (templateType === "opinionated") {
    console.log("  • Setting up Legend State store");
    setupLegendState(projectPath, false); // false = Next.js app
    
    console.log("  • Setting up Prettier and ESLint");
    setupPrettierAndESLint(projectPath, false); // false = Next.js app
  }

  // Create default migration and update config
  console.log("🔄 Creating default Supabase migration...");
  if (createSupabaseMigration(projectPath)) {
    console.log("  • Migration created successfully");
  }
  
  console.log("⚙️  Updating Supabase configuration...");
  if (updateSupabaseConfig(projectPath)) {
    console.log("  • Configuration updated successfully");
  }

  console.log("🚢 Setting up Coolify deployment configuration...");
  createCoolifyConfig(projectPath, appName);

  // Update package.json with useful scripts
  console.log("📦 Setting up development scripts...");
  updatePackageJsonScripts(projectPath, false, false); // Next.js app

  // Create custom README
  createProjectReadme(projectPath, appName, false, templateType);

  // Create CLAUDE.md for AI assistance
  console.log("📝 Creating CLAUDE.md for AI assistance...");
  createProjectClaudeMd(projectPath, appName, false, templateType);

  // Update next.config.js for standalone output (required for optimal deployment)
  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}

module.exports = nextConfig
`;

  writeFileSync(join(projectPath, 'next.config.js'), nextConfigContent);
  console.log("  • Updated Next.js configuration for deployment");

  console.log(`✅ Web app ${appName} created successfully!`);
  console.log("");
  console.log("🚀 Next steps:");
  console.log("  1. Update .env.local with your Supabase credentials");
  console.log("  2. Start Supabase locally: supabase start");
  console.log("  3. Start development server: pnpm dev");
  console.log("  4. Check COOLIFY_DEPLOYMENT.md for deployment instructions");
  console.log("");
  console.log("📝 Important:");
  console.log("  • Your Supabase keys will be shown after running 'supabase start'");
  console.log("  • Copy them to your .env.local file");
  console.log("  • For production, set up your Supabase project at supabase.com");
}
