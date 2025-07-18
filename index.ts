#!/usr/bin/env node
import {
  cancel,
  intro,
  isCancel,
  log,
  outro,
  select,
  text,
} from "@clack/prompts";
import { parseArgs } from "node:util";
import { createMonorepo, createWebOnlyApp } from "./src/generators.js";

intro("Welcome to Monolaunch");

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    template: {
      type: "string",
      short: "t",
    },
    architecture: {
      type: "string",
      short: "a",
    },
    help: {
      type: "boolean",
      short: "h",
    },
  },
  allowPositionals: true,
});

// Show help if requested
if (values.help) {
  log.info("Usage: monolaunch [app-name] [options]");
  log.info("");
  log.info("Arguments:");
  log.info("  app-name                  Name of your application");
  log.info("");
  log.info("Options:");
  log.info("  -t, --template <type>     Template type (bare|opinionated)");
  log.info(
    "  -a, --architecture <type> Architecture type (monorepo|nextjs-only)"
  );
  log.info("  -h, --help               Show help");
  log.info("");
  log.info("Examples:");
  log.info("  monolaunch my-app -t bare -a monorepo");
  log.info(
    "  monolaunch my-app --template opinionated --architecture nextjs-only"
  );
  log.info("  monolaunch my-app -t opinionated");
  log.info("  monolaunch");
  process.exit(0);
}

let appName = positionals[0];
if (!appName) {
  log.info("📝 Let's start by setting up your project name.");
  log.info(
    "This will be used as the folder name and package name for your project."
  );

  const appNamePrompt = await text({
    message: "What is your app name?",
    placeholder: "my-awesome-app",
  });

  if (isCancel(appNamePrompt)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  appName = appNamePrompt;
}

if (isCancel(appName)) {
  cancel("Operation cancelled.");
  process.exit(0);
}

log.info(`✅ Project name set to: ${appName}`);
log.info("");

let createOption = values.architecture;
if (!createOption) {
  log.info("🏗️  Next, let's decide what to build.");
  log.info("Choose the architecture that best fits your project needs:");
  log.info("");

  const createOptionPrompt = await select({
    message: "What would you like to create?",
    options: [
      {
        value: "monorepo",
        label: "Full Stack Monorepo",
        hint: "Next.js web app + React Native Expo mobile app + Supabase backend",
      },
      {
        value: "nextjs-only",
        label: "Web App Only",
        hint: "Next.js web application with Supabase backend integration",
      },
    ],
  });

  if (isCancel(createOptionPrompt)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  createOption = createOptionPrompt;
}

if (isCancel(createOption)) {
  cancel("Operation cancelled.");
  process.exit(0);
}

if (createOption && !["monorepo", "nextjs-only"].includes(createOption)) {
  cancel(
    `Invalid architecture type: ${createOption}. Must be 'monorepo' or 'nextjs-only'.`
  );
  process.exit(1);
}

log.info(`✅ Architecture selected: ${createOption}`);
log.info("");

let templateType = values.template;
if (!templateType) {
  log.info("🎨 Finally, let's choose your template configuration.");
  log.info("This determines what libraries and tooling will be included:");
  log.info("");

  const templateTypePrompt = await select({
    message: "Pick a template type.",
    options: [
      {
        value: "bare",
        label: "Bare",
        hint: "Only basic Next.js and React Native apps - no extra libraries or tooling",
      },
      {
        value: "opinionated",
        label: "Opinionated",
        hint: "Adds extra libraries: Zod, ShadCN, Legend State, ESLint, Prettier & more",
      },
    ],
  });

  if (isCancel(templateTypePrompt)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  templateType = templateTypePrompt;
}

if (isCancel(templateType)) {
  cancel("Operation cancelled.");
  process.exit(0);
}

if (templateType && !["bare", "opinionated"].includes(templateType)) {
  cancel(
    `Invalid template type: ${templateType}. Must be 'bare' or 'opinionated'.`
  );
  process.exit(1);
}

log.info(`✅ Template type set to: ${templateType}`);
log.info("");

// Log user options and exit
log.info("📋 === Project Configuration Summary ===");
log.info(`🏷️  App name: ${appName}`);
log.info(`⚙️  Template type: ${templateType}`);
log.info(`🏗️  Architecture: ${createOption}`);
log.info("");

if (createOption === "monorepo") {
  log.info("📦 Your monorepo will include:");
  log.info("   • Next.js web application");
  log.info("   • React Native Expo mobile app");
  log.info("   • Supabase backend integration");
  log.info("   • Shared packages and utilities");
} else {
  log.info("📦 Your project will include:");
  log.info("   • Next.js web application");
  log.info("   • Supabase backend integration");
  log.info("   • Optimized for web deployment");
}

log.info("");
if (templateType === "opinionated") {
  log.info("🔧 Additional libraries and tooling included:");
  log.info("   • Zod for schema validation");
  log.info("   • ShadCN UI components");
  log.info("   • Legend State for state management");
  log.info("   • ESLint & Prettier for code quality");
  log.info("   • TypeScript configuration");
  log.info("   • Testing setup and best practices");
} else {
  log.info("🔧 Bare setup includes:");
  log.info("   • Basic Next.js app (web)");
  log.info("   • Basic React Native Expo app (mobile)");
  log.info("   • No additional libraries or tooling");
  log.info("   • Clean slate for your own choices");
}

log.info("");
log.info("🚀 Starting project creation...");
log.info("");

// Call the appropriate generator function
if (createOption === "monorepo") {
  await createMonorepo(appName, templateType as "bare" | "opinionated");
} else {
  await createWebOnlyApp(appName, templateType as "bare" | "opinionated");
}

outro("Thanks for using Monolaunch! 🚀");
