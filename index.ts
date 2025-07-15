#!/usr/bin/env node
import {
  cancel,
  intro,
  isCancel,
  log,
  outro,
  select,
  text,
  spinner,
} from "@clack/prompts";
import { parseArgs } from "node:util";
import path from "node:path";
import fs from "node:fs";

intro("Welcome to Monolaunch");

const calledFromDirectory = process.cwd();

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    option: {
      type: "string",
      short: "o",
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
  log.info("Options:");
  log.info("  -o, --option <type>    Template type (bare|opinionated)");
  log.info("  -h, --help            Show help");
  log.info("");
  log.info("Examples:");
  log.info("  monolaunch my-app -o bare");
  log.info("  monolaunch my-app --option opinionated");
  log.info("  monolaunch");
  process.exit(0);
}

let appName = positionals[0];
if (!appName) {
  const appNamePrompt = await text({
    message: "What is your app name?",
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

let templateType = values.option;
if (!templateType) {
  const templateTypePrompt = await select({
    message: "Pick a template type.",
    options: [
      { value: "bare", label: "Bare" },
      { value: "opinionated", label: "Opinionated" },
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

// Always ask about app creation (as per your requirement)
const createTheApps = await select({
  message: "Create both apps or only one?",
  options: [
    { value: "both", label: "Create both nextjs and expo apps" },
    { value: "nextjs", label: "Create only nextjs app" },
    { value: "expo", label: "Create only expo app" },
  ],
});

if (isCancel(createTheApps)) {
  cancel("Operation cancelled.");
  process.exit(0);
}

log.info("Creating the template...");
log.info(`App name: ${appName}`);
log.info(`Template type: ${templateType}`);
log.info(`Target directory: ${path.join(calledFromDirectory, appName)}`);

const s = spinner();
s.start("Creating the directory!");

const targetDirectory = path.join(calledFromDirectory, appName);

try {
  fs.mkdirSync(targetDirectory, { recursive: true });
  process.chdir(targetDirectory);
  s.stop("Directory created!");
} catch (error) {
  s.stop("Failed to create directory!");
  if (error instanceof Error) {
    cancel(`Error creating directory: ${error.message}`);
  } else {
    cancel("Error creating directory: Unknown error");
  }
  process.exit(1);
}

s.start("Creating the pnpm workspace!");

s.stop("pnpm workspace created!");

if (createTheApps != "expo") {
  log.step("Creating the nextjs app!");
  if (templateType == "opinionated") {
    log.step("Setting up the nextjs app!");
  }
}

if (createTheApps != "nextjs") {
  log.step("Creating the expo app!");
  if (templateType == "opinionated") {
    log.step("Setting up the expo app!");
  }
}

log.step("Setting up supabase project locally!");

outro("Monolaunch");
