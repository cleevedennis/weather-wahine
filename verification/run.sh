#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs
python3 fetch_backtest.py | tee logs/fetch.txt
