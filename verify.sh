#!/bin/bash
set -e

echo "=== 1. Running GenVM Linter ==="
python3 -X utf8 -m genvm_linter.cli contracts/wyrm_ward.py

echo "=== 2. Running Intelligent Contract Unit Tests ==="
python3 -m pytest tests -q

echo "=== 3. Running Frontend State Machine Tests ==="
cd frontend
npm test

echo "=== 4. Verifying Production Frontend Build ==="
npm run build
cd ..

echo ""
echo "🐉 All WyrmWard verification checks PASSED!"
