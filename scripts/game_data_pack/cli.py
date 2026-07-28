from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .contracts import canonical_json
from .pipeline import build_pack


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="근거 기반 응답을 game-data-pack@2로 변환"
    )
    parser.add_argument(
        "--out-root",
        type=Path,
        default=Path("."),
    )
    parser.add_argument("--pack-id", required=True)
    parser.add_argument(
        "--merge-mode",
        choices=("alongside", "promotion"),
        required=True,
    )
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument(
        "--facet-response",
        type=Path,
        required=True,
    )
    parser.add_argument(
        "--taste-response",
        type=Path,
        required=True,
    )
    parser.add_argument(
        "--case-response",
        type=Path,
        required=True,
    )
    parser.add_argument("--promotion-targets", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    return parser


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    args = create_parser().parse_args(argv)
    try:
        out_root = args.out_root.resolve()
        output = (out_root / args.out).resolve()
        output.relative_to(out_root)
        targets = (
            _read_json(args.promotion_targets)
            if args.promotion_targets is not None
            else []
        )
        if not isinstance(targets, list):
            raise ValueError("promotion targets must be an array")
        source = _read_json(args.source)
        facet_response = _read_json(args.facet_response)
        taste_response = _read_json(args.taste_response)
        case_response = _read_json(args.case_response)
        if not all(
            isinstance(value, dict)
            for value in (
                source,
                facet_response,
                taste_response,
                case_response,
            )
        ):
            raise ValueError("all response inputs must be objects")
        pack = build_pack(
            pack_id=args.pack_id,
            merge_mode=args.merge_mode,
            source=source,
            facet_response=facet_response,
            taste_response=taste_response,
            case_response=case_response,
            promotion_targets=targets,
        )
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_suffix(output.suffix + ".tmp")
        temporary.write_text(
            canonical_json(pack),
            encoding="utf-8",
        )
        temporary.replace(output)
        return 0
    except (OSError, json.JSONDecodeError) as error:
        print(error, file=sys.stderr)
        return 2
    except (ValueError, KeyError, TypeError) as error:
        print(error, file=sys.stderr)
        return 1
