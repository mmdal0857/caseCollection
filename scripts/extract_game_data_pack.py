#!/usr/bin/env python3
"""Compatibility entry point for the game-data-pack@2 build CLI."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.game_data_pack.cli import main


if __name__ == "__main__":
    raise SystemExit(main())
