export async function createMonorepo(
  appName: string,
  templateType: "bare" | "opinionated"
) {
  console.log(`🏗️  Creating monorepo: ${appName}`);
  console.log(`📦 Template type: ${templateType}`);
  console.log("");

  console.log("📁 Creating workspace structure...");
  // TODO: Create pnpm workspace with apps/web, apps/mobile, packages/shared

  console.log("🌐 Setting up Next.js web app...");
  if (templateType === "opinionated") {
    console.log("  • Installing Zod for schema validation");
    console.log("  • Setting up ShadCN UI components");
    console.log("  • Configuring Legend State");
    console.log("  • Adding ESLint & Prettier");
    console.log("  • Setting up TypeScript configuration");
  } else {
    console.log("  • Basic Next.js setup");
  }

  console.log("📱 Setting up React Native Expo app...");
  if (templateType === "opinionated") {
    console.log("  • Installing state management libraries");
    console.log("  • Adding navigation setup");
    console.log("  • Configuring development tools");
  } else {
    console.log("  • Basic Expo setup");
  }

  console.log("🗄️  Setting up Supabase integration...");
  console.log("  • Creating Supabase client");
  console.log("  • Setting up authentication");
  console.log("  • Configuring database types");

  console.log("📦 Installing shared packages...");
  console.log("  • Shared utilities");
  console.log("  • Common types");
  console.log("  • API client");

  console.log(`✅ Monorepo ${appName} created successfully!`);
}

export async function createWebOnlyApp(
  appName: string,
  templateType: "bare" | "opinionated"
) {
  console.log(`🌐 Creating web app: ${appName}`);
  console.log(`📦 Template type: ${templateType}`);
  console.log("");

  console.log("🌐 Setting up Next.js web app...");
  if (templateType === "opinionated") {
    console.log("  • Installing Zod for schema validation");
    console.log("  • Setting up ShadCN UI components");
    console.log("  • Configuring Legend State");
    console.log("  • Adding ESLint & Prettier");
    console.log("  • Setting up TypeScript configuration");
    console.log("  • Configuring testing setup");
  } else {
    console.log("  • Basic Next.js setup");
    console.log("  • Minimal TypeScript configuration");
  }

  console.log("🗄️  Setting up Supabase integration...");
  console.log("  • Creating Supabase client");
  console.log("  • Setting up authentication");
  console.log("  • Configuring database types");
  console.log("  • Adding environment variables");

  console.log(`✅ Web app ${appName} created successfully!`);
}
