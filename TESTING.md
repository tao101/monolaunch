# Testing Monolaunch CLI

This guide covers different ways to test the Monolaunch CLI tool locally before publishing.

## 🚀 Quick Testing

### 1. Link for Global Testing (Recommended)
```bash
# In the monolaunch project directory
npm link

# Test globally
monolaunch --help
monolaunch my-test-app -t opinionated -a nextjs-only

# Unlink when done
npm unlink -g monolaunch
```

### 2. Direct Node Execution
```bash
# Quick test
npm run test:quick

# Test with arguments
node dist/index.js my-test-app --template bare --architecture monorepo
```

### 3. Using Built-in Scripts
```bash
# Quick validation
npm run test:quick

# Full test suite (creates actual projects)
npm run test

# Development mode (watch for changes)
npm run dev
```

## 🧪 Comprehensive Testing

### Run the Full Test Suite
```bash
# This will test all combinations and validate generated projects
./test-cli.sh

# Or using npm script
npm test
```

The test suite creates projects with all template/architecture combinations:
- Next.js + Bare Template
- Next.js + Opinionated Template  
- Monorepo + Bare Template
- Monorepo + Opinionated Template

### Manual Testing Scenarios

#### Test 1: Interactive Mode
```bash
monolaunch
# Follow the interactive prompts
```

#### Test 2: Command Line Arguments
```bash
# Test all combinations
monolaunch test-bare-nextjs -t bare -a nextjs-only
monolaunch test-opinionated-nextjs -t opinionated -a nextjs-only
monolaunch test-bare-monorepo -t bare -a monorepo
monolaunch test-opinionated-monorepo -t opinionated -a monorepo

# Test new CLI flags
monolaunch --version
monolaunch --help --quiet
monolaunch test-project --dry-run -t opinionated -a monorepo
monolaunch test-project --quiet -t bare -a nextjs-only
monolaunch test-project --force -t opinionated -a nextjs-only  # if directory exists
```

#### Test 3: Verify Generated Projects
```bash
cd test-opinionated-nextjs

# Check files exist
ls -la  # Should see README.md, CLAUDE.md, package.json, etc.

# Check scripts work
pnpm db:types --help  # Should show supabase command help
pnpm dev --help       # Should show next dev help

# Check types directory
ls -la types/         # Should see database.types.ts
```

#### Test 4: Monorepo Validation
```bash
cd test-opinionated-monorepo

# Check workspace structure
ls -la apps/          # Should see web/ and mobile/
ls -la packages/      # Should see shared/

# Check workspace scripts
pnpm dev --help       # Should show parallel execution
pnpm db:types --help  # Should work from root

# Check individual apps
cd apps/web && ls -la  # Next.js structure
cd apps/mobile && ls -la  # Expo structure
```

## 🐛 Debugging

### Common Issues

**Issue**: "monolaunch: command not found"
**Solution**: 
```bash
npm link  # Make sure linking was successful
which monolaunch  # Should show a path
```

**Issue**: "Permission denied"
**Solution**:
```bash
chmod +x dist/index.js
# Or run with node directly:
node dist/index.js --help
```

**Issue**: "Module not found"
**Solution**:
```bash
npm run build  # Rebuild the project
npm install    # Reinstall dependencies
```

### Development Testing Workflow

1. **Make changes** to TypeScript source files
2. **Rebuild**: `npm run build`
3. **Test quickly**: `npm run test:quick`
4. **Test thoroughly**: `npm test` (if major changes)
5. **Manual testing**: Create a real project and try using it

### Testing Generated Projects

After creating a project, verify it works:

```bash
# For Next.js projects
cd your-test-project
pnpm install  # Install dependencies
pnpm supabase:start  # Start local Supabase
pnpm dev  # Should start on localhost:3000

# For monorepo projects
cd your-test-monorepo
pnpm install  # Install all workspace dependencies
pnpm supabase:start  # Start local Supabase
pnpm dev  # Should start both web and mobile
```

## 📦 Pre-Publication Testing

Before publishing to npm:

```bash
# 1. Full test suite
npm test

# 2. Pack and test locally
npm pack
npm install -g ./monolaunch-1.0.1.tgz
monolaunch test-final-check -t opinionated -a monorepo

# 3. Clean up
npm uninstall -g monolaunch
rm monolaunch-*.tgz
```

## 🤖 Automated Testing (Future)

Consider adding these automated tests:
- Unit tests for utility functions
- Integration tests for project generation
- Snapshot tests for generated file contents
- CI/CD pipeline with GitHub Actions

For now, the comprehensive test script provides good coverage of all major functionality.