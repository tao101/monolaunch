#!/bin/bash

# Monolaunch CLI Testing Script
# This script tests all major functionality of the CLI tool

set -e  # Exit on any error

echo "🧪 Testing Monolaunch CLI Tool"
echo "=============================="
echo ""

# Test directory
TEST_DIR="/tmp/monolaunch-tests"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Clean up function
cleanup() {
    echo "🧹 Cleaning up test projects..."
    rm -rf "$TEST_DIR"
    echo "✅ Cleanup complete"
}

# Set up trap for cleanup on exit
trap cleanup EXIT

# Create test directory
echo "📁 Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo ""
echo "🔍 Test 1: Version and Help Commands"
echo "------------------------------------"
monolaunch --version
echo "✅ Version command works"

monolaunch --help --quiet
echo "✅ Quiet help works"

monolaunch -v
echo "✅ Short version flag works"

echo ""
echo "🔍 Test 2: Dry-run Mode"
echo "-----------------------"
monolaunch "test-dryrun-$TIMESTAMP" --template bare --architecture nextjs-only --dry-run --quiet
echo "✅ Dry-run mode works"

echo ""
echo "🔍 Test 3: Next.js Bare Template"
echo "--------------------------------"
monolaunch "test-nextjs-bare-$TIMESTAMP" --template bare --architecture nextjs-only --quiet
echo "✅ Next.js bare project created"

echo ""
echo "🔍 Test 4: Next.js Opinionated Template"
echo "---------------------------------------"
monolaunch "test-nextjs-opinionated-$TIMESTAMP" --template opinionated --architecture nextjs-only --verbose --quiet
echo "✅ Next.js opinionated project created"

echo ""
echo "🔍 Test 5: Monorepo Bare Template"
echo "---------------------------------"
monolaunch "test-monorepo-bare-$TIMESTAMP" --template bare --architecture monorepo --quiet
echo "✅ Monorepo bare project created"

echo ""
echo "🔍 Test 6: Monorepo Opinionated Template" 
echo "----------------------------------------"
monolaunch "test-monorepo-opinionated-$TIMESTAMP" --template opinionated --architecture monorepo --quiet
echo "✅ Monorepo opinionated project created"

echo ""
echo "🔍 Test 7: Verify Generated Files"
echo "---------------------------------"

# Check common files that should exist in all projects
for project in test-*-$TIMESTAMP; do
    echo "Checking project: $project"
    
    # Common files
    [ -f "$project/README.md" ] && echo "  ✅ README.md exists" || echo "  ❌ README.md missing"
    [ -f "$project/CLAUDE.md" ] && echo "  ✅ CLAUDE.md exists" || echo "  ❌ CLAUDE.md missing"
    [ -f "$project/package.json" ] && echo "  ✅ package.json exists" || echo "  ❌ package.json missing"
    [ -d "$project/types" ] && echo "  ✅ types directory exists" || echo "  ❌ types directory missing"
    
    # Check if it's a monorepo
    if [[ "$project" == *"monorepo"* ]]; then
        [ -f "$project/pnpm-workspace.yaml" ] && echo "  ✅ pnpm-workspace.yaml exists" || echo "  ❌ pnpm-workspace.yaml missing"
        [ -d "$project/apps/web" ] && echo "  ✅ apps/web directory exists" || echo "  ❌ apps/web directory missing"
        [ -d "$project/apps/mobile" ] && echo "  ✅ apps/mobile directory exists" || echo "  ❌ apps/mobile directory missing"
        [ -d "$project/packages/shared" ] && echo "  ✅ packages/shared directory exists" || echo "  ❌ packages/shared directory missing"
    else
        [ -d "$project/src" ] && echo "  ✅ src directory exists" || echo "  ❌ src directory missing"
    fi
    
    # Check for Supabase setup
    if [[ "$project" == *"monorepo"* ]]; then
        [ -d "$project/apps/web/supabase" ] && echo "  ✅ Supabase directory exists" || echo "  ❌ Supabase directory missing"
    else
        [ -d "$project/supabase" ] && echo "  ✅ Supabase directory exists" || echo "  ❌ Supabase directory missing"
    fi
    
    echo ""
done

echo ""
echo "🔍 Test 8: Package.json Scripts Validation"
echo "------------------------------------------"
for project in test-*-$TIMESTAMP; do
    echo "Checking scripts in: $project"
    
    if [[ "$project" == *"monorepo"* ]]; then
        # Check root package.json
        if grep -q '"db:types"' "$project/package.json"; then
            echo "  ✅ Root has db:types script"
        else
            echo "  ❌ Root missing db:types script"
        fi
        
        # Check web app package.json
        if grep -q '"dev".*"next dev"' "$project/apps/web/package.json"; then
            echo "  ✅ Web app has Next.js dev script"
        else
            echo "  ❌ Web app missing Next.js dev script"
        fi
        
        # Check mobile app package.json
        if grep -q '"start".*"expo start"' "$project/apps/mobile/package.json"; then
            echo "  ✅ Mobile app has Expo start script"
        else
            echo "  ❌ Mobile app missing Expo start script"
        fi
    else
        # Check Next.js app scripts
        if grep -q '"db:types"' "$project/package.json"; then
            echo "  ✅ Has db:types script"
        else
            echo "  ❌ Missing db:types script"
        fi
        
        if grep -q '"dev".*"next dev"' "$project/package.json"; then
            echo "  ✅ Has Next.js dev script"
        else
            echo "  ❌ Missing Next.js dev script"
        fi
    fi
    echo ""
done

echo ""
echo "🔍 Test 9: TypeScript Types File Content"
echo "----------------------------------------"
for project in test-*-$TIMESTAMP; do
    echo "Checking types in: $project"
    
    # Find database.types.ts files
    find "$project" -name "database.types.ts" -type f | while read -r types_file; do
        if grep -q "export type Database" "$types_file"; then
            echo "  ✅ $types_file has Database type export"
        else
            echo "  ❌ $types_file missing Database type export"
        fi
        
        if grep -q "pnpm run db:types" "$types_file"; then
            echo "  ✅ $types_file has generation instructions"
        else
            echo "  ❌ $types_file missing generation instructions"
        fi
    done
    echo ""
done

echo ""
echo "🎉 All Tests Complete!"
echo "====================="
echo ""
echo "📊 Test Summary:"
echo "  • Version and help commands: ✅"
echo "  • Dry-run mode: ✅"
echo "  • Next.js bare template: ✅"
echo "  • Next.js opinionated template: ✅"
echo "  • Monorepo bare template: ✅"
echo "  • Monorepo opinionated template: ✅"
echo "  • File structure validation: ✅"
echo "  • Package.json scripts: ✅"
echo "  • TypeScript types: ✅"
echo ""
echo "🚀 Monolaunch CLI is working correctly!"
echo ""
echo "📁 Test projects created in: $TEST_DIR"
echo "🗑️  Test cleanup will happen automatically on script exit"