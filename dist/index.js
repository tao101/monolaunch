#!/usr/bin/env node
import { cancel, intro, isCancel, log, outro, select, text, } from "@clack/prompts";
import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createMonorepo, createWebOnlyApp } from "./src/generators.js";
// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// In development, package.json is in the same directory as index.ts
// In production (dist), package.json is one level up
const packageJsonPath = join(__dirname, "package.json");
const packageJsonPathDist = join(__dirname, "..", "package.json");
const packageJsonContent = existsSync(packageJsonPath)
    ? readFileSync(packageJsonPath, "utf8")
    : readFileSync(packageJsonPathDist, "utf8");
const packageJson = JSON.parse(packageJsonContent);
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
        version: {
            type: "boolean",
            short: "v",
        },
        verbose: {
            type: "boolean",
        },
        quiet: {
            type: "boolean",
            short: "q",
        },
        force: {
            type: "boolean",
            short: "f",
        },
        "dry-run": {
            type: "boolean",
        },
    },
    allowPositionals: true,
});
// Handle version flag
if (values.version) {
    console.log(`monolaunch v${packageJson.version}`);
    process.exit(0);
}
// Handle quiet mode
if (values.quiet) {
    // Suppress intro for quiet mode
}
else {
    intro("Welcome to Monolaunch");
}
// Show help if requested
if (values.help) {
    if (!values.quiet) {
        log.info("Usage: monolaunch [app-name] [options]");
        log.info("");
        log.info("Arguments:");
        log.info("  app-name                    Name of your application");
        log.info("");
        log.info("Options:");
        log.info("  -t, --template <type>       Template type (bare|opinionated)");
        log.info("  -a, --architecture <type>   Architecture type (monorepo|nextjs-only)");
        log.info("  -h, --help                  Show help information");
        log.info("  -v, --version               Show version number");
        log.info("  -q, --quiet                 Suppress output (no prompts)");
        log.info("  -f, --force                 Force overwrite existing directory");
        log.info("      --verbose               Show detailed output");
        log.info("      --dry-run               Show what would be created without creating");
        log.info("");
        log.info("Examples:");
        log.info("  monolaunch my-app -t bare -a monorepo");
        log.info("  monolaunch my-app --template opinionated --architecture nextjs-only");
        log.info("  monolaunch my-app -t opinionated --verbose");
        log.info("  monolaunch my-app --dry-run");
        log.info("  monolaunch --version");
        log.info("  monolaunch");
    }
    else {
        console.log("monolaunch - A CLI tool for creating full-stack projects");
        console.log("Usage: monolaunch [app-name] [options]");
        console.log("Use 'monolaunch --help' without --quiet for detailed help");
    }
    process.exit(0);
}
let appName = positionals[0];
if (!appName) {
    if (values.quiet) {
        console.error("Error: app-name is required in quiet mode");
        process.exit(1);
    }
    log.info("📝 Let's start by setting up your project name.");
    log.info("This will be used as the folder name and package name for your project.");
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
// Check if directory already exists
const targetDirectory = join(process.cwd(), appName);
if (existsSync(targetDirectory)) {
    if (!values.force) {
        const errorMsg = `Directory '${appName}' already exists. Use --force to overwrite.`;
        if (values.quiet) {
            console.error(errorMsg);
            process.exit(1);
        }
        else {
            cancel(errorMsg);
            process.exit(1);
        }
    }
    else if (values.verbose && !values.quiet) {
        log.warning(`Directory '${appName}' exists, but --force flag provided. Will overwrite.`);
    }
}
if (!values.quiet) {
    log.info(`✅ Project name set to: ${appName}`);
    log.info("");
}
let createOption = values.architecture;
if (!createOption) {
    if (values.quiet) {
        console.error("Error: --architecture is required in quiet mode (monorepo|nextjs-only)");
        process.exit(1);
    }
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
    const errorMsg = `Invalid architecture type: ${createOption}. Must be 'monorepo' or 'nextjs-only'.`;
    if (values.quiet) {
        console.error(errorMsg);
        process.exit(1);
    }
    else {
        cancel(errorMsg);
        process.exit(1);
    }
}
if (!values.quiet) {
    log.info(`✅ Architecture selected: ${createOption}`);
    log.info("");
}
let templateType = values.template;
if (!templateType) {
    if (values.quiet) {
        console.error("Error: --template is required in quiet mode (bare|opinionated)");
        process.exit(1);
    }
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
    const errorMsg = `Invalid template type: ${templateType}. Must be 'bare' or 'opinionated'.`;
    if (values.quiet) {
        console.error(errorMsg);
        process.exit(1);
    }
    else {
        cancel(errorMsg);
        process.exit(1);
    }
}
if (!values.quiet) {
    log.info(`✅ Template type set to: ${templateType}`);
    log.info("");
}
// Show configuration summary
if (!values.quiet) {
    log.info("📋 === Project Configuration Summary ===");
    log.info(`🏷️  App name: ${appName}`);
    log.info(`⚙️  Template type: ${templateType}`);
    log.info(`🏗️  Architecture: ${createOption}`);
    log.info("");
}
else if (values.verbose) {
    console.log(`Creating ${createOption} project: ${appName} (${templateType})`);
}
if (!values.quiet) {
    if (createOption === "monorepo") {
        log.info("📦 Your monorepo will include:");
        log.info("   • Next.js web application");
        log.info("   • React Native Expo mobile app");
        log.info("   • Supabase backend integration");
        log.info("   • Shared packages and utilities");
    }
    else {
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
    }
    else {
        log.info("🔧 Bare setup includes:");
        log.info("   • Basic Next.js app (web)");
        log.info("   • Basic React Native Expo app (mobile)");
        log.info("   • No additional libraries or tooling");
        log.info("   • Clean slate for your own choices");
    }
    log.info("");
    log.info("🚀 Starting project creation...");
    log.info("");
}
// Handle dry-run mode
if (values["dry-run"]) {
    if (values.quiet) {
        console.log("DRY RUN - No files would be created");
        console.log(`Project: ${appName}`);
        console.log(`Architecture: ${createOption}`);
        console.log(`Template: ${templateType}`);
        console.log(`Target directory: ${targetDirectory}`);
    }
    else {
        log.info("🔍 DRY RUN MODE - Showing what would be created:");
        log.info(`📁 Target directory: ${targetDirectory}`);
        log.info(`🏗️  Architecture: ${createOption}`);
        log.info(`📦 Template: ${templateType}`);
        log.info("");
        log.info("Files and directories that would be created:");
        if (createOption === "monorepo") {
            log.info("   📁 apps/web/ (Next.js application)");
            log.info("   📁 apps/mobile/ (Expo application)");
            log.info("   📁 packages/shared/ (Shared utilities)");
            log.info("   📄 pnpm-workspace.yaml");
        }
        else {
            log.info("   📁 src/ (Next.js source code)");
            log.info("   📁 supabase/ (Database configuration)");
        }
        log.info("   📄 README.md");
        log.info("   📄 CLAUDE.md");
        log.info("   📄 COOLIFY_DEPLOYMENT.md");
        log.info("   📄 package.json");
        log.info("   📁 types/ (TypeScript definitions)");
        if (templateType === "opinionated") {
            log.info("   📁 components/ui/ (UI components)");
            log.info("   📄 Legend State configuration");
        }
        log.info("");
        log.info("ℹ️  Use without --dry-run to actually create the project");
    }
    process.exit(0);
}
// Call the appropriate generator function
const options = {
    verbose: values.verbose || false,
    quiet: values.quiet || false,
    force: values.force || false,
};
if (createOption === "monorepo") {
    await createMonorepo(appName, templateType, options);
}
else {
    await createWebOnlyApp(appName, templateType, options);
}
if (!values.quiet) {
    outro("Thanks for using Monolaunch! 🚀");
}
else if (values.verbose) {
    console.log(`Project ${appName} created successfully`);
}
//# sourceMappingURL=index.js.map