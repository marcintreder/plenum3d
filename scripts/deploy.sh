#!/bin/bash
set -e

# Autonomous Deploy Script for Sculpt3D
# 🎒 Samwise's Safety Check

echo "🚀 Starting Autonomous Deploy Pipeline..."

# 1. Run Unit Tests
echo "🧪 Running Unit Tests..."
npm test

# 2. Run E2E Tests (Local)
echo "🎭 Running E2E Tests (Local)..."
# Start local server
npm run dev &
DEV_PID=$!

# Wait for server to be ready
sleep 5

# Run tests against local
TEST_URL=http://localhost:5173 npm run test:e2e

# Kill server
kill $DEV_PID

# 3. Git Identity Check
GIT_EMAIL=$(git config user.email)
if [ "$GIT_EMAIL" != "samwisegamgee@agentmail.to" ]; then
  echo "❌ Error: Git identity mismatch ($GIT_EMAIL)"
  exit 1
fi

# 4. Push to main
echo "📦 Pushing to main..."
GIT_SSH_COMMAND="ssh -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no" git push origin main

echo "✅ Deploy Complete! Sculpt3D is live and verified."
