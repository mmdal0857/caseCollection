from __future__ import annotations

import json
from dataclasses import dataclass
from hashlib import sha256
from typing import Any, Literal, TypedDict, cast

KINDS = {"사람", "사물", "행위", "기록", "현상"}
SUITS = {"physical", "behavioral", "documentary", "forensic"}
FRAMES = {
    "route",
    "means",
    "trace",
    "action",
    "motive",
    "record",
    "omission",
    "scene",
    "identity",
}
TAG_RUBRIC = {
    "공개": "정보·행동이 공적 기록이나 다수에게 드러난다.",
    "은밀": "노출을 피하고 제한된 접근·관찰·회수로만 확인된다.",
    "강압": "위협·압박으로 진술이나 행동을 얻는다.",
    "신중": "증거 보존·절차·검증을 우선한다.",
    "논리": "모순·시간·인과·배제로 가능한 해석을 줄인다.",
}


@dataclass(frozen=True)
class ExtractionIssue:
    code: str
    path: str
    message: str


class TasteDecision(TypedDict):
    decision: Literal["keep", "reject"]
    tasteScore: int
    reasons: list[str]


def canonical_json(value: Any) -> str:
    return (
        json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        + "\n"
    )


def canonical_sha256(value: Any) -> str:
    return sha256(canonical_json(value).encode("utf-8")).hexdigest()


def _issue(
    issues: list[ExtractionIssue],
    code: str,
    path: str,
    message: str,
) -> None:
    issues.append(ExtractionIssue(code, path, message))


def _source_paragraphs(
    source: dict[str, Any],
    issues: list[ExtractionIssue],
) -> dict[str, str]:
    raw = source.get("paragraphs")
    if not isinstance(raw, list) or not raw:
        _issue(
            issues,
            "SOURCE_PARAGRAPHS_INVALID",
            "source.paragraphs",
            "paragraphs는 비어 있지 않은 배열이어야 한다",
        )
        return {}
    paragraphs: dict[str, str] = {}
    for index, item in enumerate(raw):
        path = f"source.paragraphs.{index}"
        if not isinstance(item, dict):
            _issue(issues, "SOURCE_PARAGRAPH_INVALID", path, "문단이 객체가 아니다")
            continue
        paragraph_id = item.get("id")
        text = item.get("text")
        if not isinstance(paragraph_id, str) or not paragraph_id:
            _issue(issues, "SOURCE_PARAGRAPH_INVALID", f"{path}.id", "id가 없다")
            continue
        if paragraph_id in paragraphs:
            _issue(
                issues,
                "SOURCE_PARAGRAPH_DUPLICATE",
                f"{path}.id",
                f"문단 id가 중복됐다: {paragraph_id}",
            )
            continue
        if not isinstance(text, str):
            _issue(
                issues,
                "SOURCE_PARAGRAPH_INVALID",
                f"{path}.text",
                "text가 문자열이 아니다",
            )
            continue
        paragraphs[paragraph_id] = text
    source_hash = source.get("sha256")
    joined = "\n".join(paragraphs.values())
    if (
        not isinstance(source_hash, str)
        or sha256(joined.encode("utf-8")).hexdigest() != source_hash
    ):
        _issue(
            issues,
            "SOURCE_HASH_MISMATCH",
            "source.sha256",
            "문단 원문 SHA-256과 source.sha256이 다르다",
        )
    return paragraphs


def validate_facet_drafts(
    source: dict[str, Any],
    response: dict[str, Any],
) -> list[ExtractionIssue]:
    issues: list[ExtractionIssue] = []
    paragraphs = _source_paragraphs(source, issues)
    if set(response) != {"card", "facets"}:
        _issue(
            issues,
            "RESPONSE_FIELDS_INVALID",
            "$",
            "response는 card와 facets만 가져야 한다",
        )

    card = response.get("card")
    if not isinstance(card, dict):
        _issue(issues, "CARD_INVALID", "card", "card가 객체가 아니다")
        card = {}
    elif set(card) != {"id", "name", "suit", "kind"}:
        _issue(
            issues,
            "CARD_FIELDS_INVALID",
            "card",
            "card는 id, name, suit, kind만 가져야 한다",
        )
    if not isinstance(card.get("id"), str) or not card["id"]:
        _issue(issues, "CARD_ID_INVALID", "card.id", "card id가 없다")
    name = card.get("name")
    if (
        not isinstance(name, str)
        or not name
        or not "\uac00" <= name[-1] <= "\ud7a3"
    ):
        _issue(
            issues,
            "CARD_NAME_INVALID",
            "card.name",
            "카드명은 완성형 한글로 끝나야 한다",
        )
    if card.get("suit") not in SUITS:
        _issue(issues, "SUIT_INVALID", "card.suit", "허용 suit가 아니다")
    if card.get("kind") not in KINDS:
        _issue(issues, "KIND_INVALID", "card.kind", "허용 kind가 아니다")

    facets = response.get("facets")
    if not isinstance(facets, list) or not facets:
        _issue(
            issues,
            "FACETS_INVALID",
            "facets",
            "facets는 비어 있지 않은 배열이어야 한다",
        )
        return issues

    seen_frames: set[str] = set()
    for index, raw_facet in enumerate(facets):
        path = f"facets.{index}"
        if not isinstance(raw_facet, dict):
            _issue(issues, "FACET_INVALID", path, "facet이 객체가 아니다")
            continue
        facet = cast(dict[str, Any], raw_facet)
        if set(facet) != {
            "frame",
            "meaning",
            "tags",
            "tagReasons",
            "evidence",
        }:
            _issue(
                issues,
                "FACET_FIELDS_INVALID",
                path,
                "facet 필드가 계약과 다르다",
            )
        frame = facet.get("frame")
        if frame not in FRAMES:
            _issue(
                issues,
                "FRAME_INVALID",
                f"{path}.frame",
                "허용 frame이 아니다",
            )
        elif frame in seen_frames:
            _issue(
                issues,
                "FRAME_DUPLICATE",
                f"{path}.frame",
                "card 안에서 frame이 중복됐다",
            )
        else:
            seen_frames.add(cast(str, frame))
        meaning = facet.get("meaning")
        if not isinstance(meaning, str) or not meaning.strip():
            _issue(
                issues,
                "MEANING_INVALID",
                f"{path}.meaning",
                "meaning이 비어 있다",
            )

        tags = facet.get("tags")
        if not isinstance(tags, list) or not 1 <= len(tags) <= 2:
            _issue(
                issues,
                "TAG_COUNT_INVALID",
                f"{path}.tags",
                "tag는 1~2개여야 한다",
            )
            tags = []
        elif len(set(tags)) != len(tags):
            _issue(
                issues,
                "TAG_DUPLICATE",
                f"{path}.tags",
                "tag가 중복됐다",
            )
        reasons = facet.get("tagReasons")
        if not isinstance(reasons, dict):
            reasons = {}
        for tag in tags:
            if tag not in TAG_RUBRIC:
                _issue(
                    issues,
                    "TAG_INVALID",
                    f"{path}.tags",
                    f"허용 tag가 아니다: {tag}",
                )
            reason = reasons.get(tag)
            if not isinstance(reason, str) or not reason.strip():
                _issue(
                    issues,
                    "TAG_REASON_MISSING",
                    f"{path}.tagReasons.{tag}",
                    "rubric 근거가 없다",
                )
        if set(reasons) != set(tags):
            for tag in set(tags) - set(reasons):
                if not any(
                    issue.code == "TAG_REASON_MISSING"
                    and issue.path == f"{path}.tagReasons.{tag}"
                    for issue in issues
                ):
                    _issue(
                        issues,
                        "TAG_REASON_MISSING",
                        f"{path}.tagReasons.{tag}",
                        "rubric 근거가 없다",
                    )
            for tag in set(reasons) - set(tags):
                _issue(
                    issues,
                    "TAG_REASON_UNUSED",
                    f"{path}.tagReasons.{tag}",
                    "선택하지 않은 tag의 사유가 있다",
                )

        evidence = facet.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            _issue(
                issues,
                "EVIDENCE_MISSING",
                f"{path}.evidence",
                "원문 근거가 없다",
            )
            continue
        for evidence_index, raw_item in enumerate(evidence):
            evidence_path = f"{path}.evidence.{evidence_index}"
            if not isinstance(raw_item, dict):
                _issue(
                    issues,
                    "EVIDENCE_MISMATCH",
                    evidence_path,
                    "근거가 객체가 아니다",
                )
                continue
            item = cast(dict[str, Any], raw_item)
            if set(item) != {"paragraphId", "start", "end", "quote"}:
                _issue(
                    issues,
                    "EVIDENCE_FIELDS_INVALID",
                    evidence_path,
                    "근거 필드가 계약과 다르다",
                )
            text = paragraphs.get(item.get("paragraphId"))
            start = item.get("start")
            end = item.get("end")
            quote = item.get("quote")
            if (
                text is None
                or not isinstance(start, int)
                or isinstance(start, bool)
                or not isinstance(end, int)
                or isinstance(end, bool)
                or start < 0
                or end < start
                or end > len(text)
                or text[start:end] != quote
            ):
                _issue(
                    issues,
                    "EVIDENCE_MISMATCH",
                    evidence_path,
                    "원문 span과 quote가 일치하지 않는다",
                )
    return issues


def validate_taste_response(value: dict[str, Any]) -> TasteDecision:
    if set(value) != {"decision", "tasteScore", "reasons"}:
        raise ValueError(
            "taste response fields must be decision, tasteScore, reasons"
        )
    score = value["tasteScore"]
    reasons = value["reasons"]
    if (
        value["decision"] not in {"keep", "reject"}
        or not isinstance(score, int)
        or isinstance(score, bool)
        or not 0 <= score <= 100
        or not isinstance(reasons, list)
        or not reasons
        or not all(
            isinstance(reason, str) and bool(reason.strip())
            for reason in reasons
        )
    ):
        raise ValueError("invalid taste response")
    return cast(TasteDecision, value)
