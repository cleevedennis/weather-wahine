#!/usr/bin/env bash
# The current study step. Edited per stage; outputs land in verification/ and are committed by the workflow.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs
{ for s in 1 2 3; do python3 parity_test.py "$s"; done; for s in 4 5 6; do FINE=1 python3 parity_test.py "$s"; done; } | tee logs/parity.txt
python3 probe.py | tee logs/probe.txt
