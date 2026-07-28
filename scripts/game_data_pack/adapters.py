from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Protocol

from .contracts import (
    canonical_sha256,
    validate_facet_drafts,
    validate_taste_response,
)


class FacetExtractor(Protocol):
    def extract(self, request: dict[str, Any]) -> dict[str, Any]: ...


class TasteFilter(Protocol):
    def decide(self, request: dict[str, Any]) -> dict[str, Any]: ...


class CaseAssembler(Protocol):
    def assemble(self, request: dict[str, Any]) -> dict[str, Any]: ...


class ReplayJsonAdapter:
    def __init__(self, root: Path, suffix: str) -> None:
        self.root = root
        self.suffix = suffix

    def run(self, request: dict[str, Any]) -> dict[str, Any]:
        path = self.root / (
            f"{canonical_sha256(request)}.{self.suffix}.json"
        )
        value = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(value, dict):
            raise ValueError(f"replay response must be an object: {path}")
        return value


class FacetReplayExtractor:
    def __init__(self, replay: ReplayJsonAdapter) -> None:
        self.replay = replay

    def extract(self, request: dict[str, Any]) -> dict[str, Any]:
        response = self.replay.run(request)
        source = request.get("source")
        if not isinstance(source, dict):
            raise ValueError("facet request must contain source")
        issues = validate_facet_drafts(source, response)
        if issues:
            detail = "; ".join(
                f"{issue.code} {issue.path}: {issue.message}"
                for issue in issues
            )
            raise ValueError(detail)
        return response


class ReplayTasteFilter:
    def __init__(self, replay: ReplayJsonAdapter) -> None:
        self.replay = replay

    def decide(self, request: dict[str, Any]) -> dict[str, Any]:
        response = self.replay.run(request)
        return validate_taste_response(response)


class ReplayCaseAssembler:
    def __init__(self, response_path: Path) -> None:
        self.response_path = response_path

    def assemble(self, request: dict[str, Any]) -> dict[str, Any]:
        del request
        response = json.loads(
            self.response_path.read_text(encoding="utf-8")
        )
        if (
            not isinstance(response, dict)
            or set(response) != {"cases"}
            or not isinstance(response["cases"], list)
        ):
            raise ValueError("case response must contain only cases[]")
        return response
