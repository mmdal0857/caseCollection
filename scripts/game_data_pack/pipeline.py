from __future__ import annotations

import copy
from typing import Any

from .contracts import (
    canonical_sha256,
    validate_facet_drafts,
    validate_taste_response,
)


def _format_issues(issues: list[Any]) -> str:
    return "; ".join(
        f"{issue.code} {issue.path}: {issue.message}"
        for issue in issues
    )


def _clue_from_facet_response(
    pack_id: str,
    merge_mode: str,
    response: dict[str, Any],
) -> dict[str, Any]:
    card = response["card"]
    source_id = card["id"]
    clue_id = (
        f"{pack_id}.{source_id}"
        if merge_mode == "alongside"
        else source_id
    )
    facets = [
        {
            "key": f"{clue_id}:{facet['frame']}",
            "frame": facet["frame"],
            "meaning": facet["meaning"],
            "note": facet["meaning"],
            "tags": facet["tags"],
        }
        for facet in response["facets"]
    ]
    return {
        "id": clue_id,
        "name": card["name"],
        "suit": card["suit"],
        "kind": card["kind"],
        "tags": sorted({
            tag
            for facet in facets
            for tag in facet["tags"]
        }),
        "text": " / ".join(
            facet["meaning"] for facet in facets
        ),
        "facets": facets,
    }


def _require_promotion_target(
    clue_id: str,
    promotion_targets: list[dict[str, Any]],
) -> None:
    matches = [
        target
        for target in promotion_targets
        if target.get("kind") == "clue"
        and target.get("id") == clue_id
        and isinstance(target.get("expectedSourcePack"), str)
        and bool(target["expectedSourcePack"])
    ]
    if len(matches) != 1:
        raise ValueError(
            f"promotion target missing or ambiguous: {clue_id}"
        )


def _build_provenance(
    source: dict[str, Any],
    facet_response: dict[str, Any],
) -> dict[str, Any]:
    return {
        "sourceSnapshotIds": [source["id"]],
        "inputSha256": canonical_sha256(source),
        "rawResponseSha256": canonical_sha256(facet_response),
        "validatorVersion": "facet-contract-v1",
        "outputSha256": "0" * 64,
    }


def _pack_output_sha256(pack: dict[str, Any]) -> str:
    normalized = copy.deepcopy(pack)
    normalized["provenance"]["outputSha256"] = "0" * 64
    return canonical_sha256(normalized)


def build_pack(
    *,
    pack_id: str,
    merge_mode: str,
    source: dict[str, Any],
    facet_response: dict[str, Any],
    taste_response: dict[str, Any],
    case_response: dict[str, Any],
    promotion_targets: list[dict[str, Any]],
) -> dict[str, Any]:
    if merge_mode not in {"alongside", "promotion"}:
        raise ValueError(
            "merge_mode must be alongside or promotion"
        )
    if (
        set(case_response) != {"cases"}
        or not isinstance(case_response["cases"], list)
    ):
        raise ValueError("case response must contain only cases[]")
    extraction_issues = validate_facet_drafts(
        source,
        facet_response,
    )
    if extraction_issues:
        raise ValueError(_format_issues(extraction_issues))
    taste = validate_taste_response(taste_response)
    if taste["decision"] != "keep":
        raise ValueError("taste filter rejected extraction")
    clue = _clue_from_facet_response(
        pack_id,
        merge_mode,
        facet_response,
    )
    if merge_mode == "promotion":
        _require_promotion_target(
            clue["id"],
            promotion_targets,
        )
    pack: dict[str, Any] = {
        "format": "game-data-pack",
        "formatVersion": 2,
        "id": pack_id,
        "mergeMode": merge_mode,
        "promotionTargets": promotion_targets,
        "provenance": _build_provenance(
            source,
            facet_response,
        ),
        "clues": {clue["id"]: clue},
        "cases": case_response["cases"],
    }
    pack["provenance"]["outputSha256"] = (
        _pack_output_sha256(pack)
    )
    return pack
