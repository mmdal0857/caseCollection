#!/usr/bin/env python3
"""게임측 원문 기반 태그 추출 파이프라인 — 뼈대 (티켓 14).

OUT 코어(f:/Project/out)의 산출물을 소비해 게임 데이터 팩(game-data-pack.json)을
만드는 **게임측 빌드 스테이지**다(티켓 06: 코어는 게임 무관 — 문맥 태그를 몰라야 한다).
런타임 LLM·서버 0 — 이 파이프라인은 빌드타임에만 돈다.

소스 (티켓 02 인벤토리 기준):
  - catalog.json                    책 카탈로그 (pg_id -> 원문)
  - docs/wiki/clues/<suit>.md       clue_type 라이브러리 (4파일 = 4슈트, frontmatter YAML)
  - docs/wiki/case-patterns/*.md    사건 골격 (locked-room 등 4종)
  - raw_texts/<pg_id>.txt           원문 (구텐베르크)
  - cleaned_texts/<pg_id>/chNN.txt  정제 원문 (코어 산출물 — 추출은 이쪽 우선)

스테이지:
  1. load_sources        소스 존재 확인·적재
  2. select_candidates   clue_type -> 카드 후보 (suit = 파일명)
  3. extract_facets      원문 기반 얼굴·문맥 태그 추출  [STUB — LLM 스테이지, 티켓 14 미결]
  4. assemble_cases      case_pattern -> case 생성      [STUB — 티켓 14 미결]
  5. validate            schema/game-data-pack.json 대조 (enum은 스키마에서 읽어 자동 동기화)
  6. emit                팩 JSON 출력

수제 시드와의 병합은 이 스크립트가 하지 않는다 — 로더(datapack.ts mergePacks)의
base→mod 상쇄 규칙이 담당한다. 이 스크립트의 산출물은 mod 팩 꼴(clues만 실은 팩)이며,
base 팩 위에 병합해야 플레이 가능하다.

실행:
  py scripts/extract_game_data_pack.py                  # 인벤토리·계획 리포트만 (기본)
  py scripts/extract_game_data_pack.py --emit-draft     # 자리표시자 얼굴로 초안 팩 생성+검증
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "prototype" / "core-loop" / "schema" / "game-data-pack.json"

PACK_FORMAT = "game-data-pack"
PACK_FORMAT_VERSION = 1

# 슈트 -> 초안 기본값 휴리스틱. LLM 추출(스테이지 3)이 확정하기 전의 자리표시자일 뿐이다.
# TODO(14): 단서 유형별 태그·얼굴 매핑은 LLM 추출·검증 절차가 확정되면 교체.
DRAFT_KIND = {"physical": "사물", "behavioral": "행위", "documentary": "기록", "forensic": "현상"}
DRAFT_FRAME = {"physical": "trace", "behavioral": "action", "documentary": "record", "forensic": "record"}


@dataclass
class Sources:
    out_root: Path
    catalog: dict | None = None
    clue_libs: dict[str, list[dict]] = field(default_factory=dict)  # suit -> clue_type 목록
    patterns: list[str] = field(default_factory=list)  # case-pattern id
    raw_texts: list[str] = field(default_factory=list)  # pg_id
    cleaned: list[str] = field(default_factory=list)  # pg_id


def parse_clue_frontmatter(md: str) -> list[dict]:
    """wiki clues/<suit>.md frontmatter의 `clues:` 블록만 뽑는 최소 파서.

    PyYAML 없이 돌게 한다 — 대상 구조가 '평평한 스칼라 dict의 리스트'로 고정돼 있어
    (id/label/observation/inference/renpy_var) 범용 YAML이 필요 없다.
    """
    m = re.search(r"^---\n(.*?)\n---", md, re.S)
    if not m:
        return []
    lines = m.group(1).splitlines()
    try:
        start = next(i for i, ln in enumerate(lines) if ln.rstrip() == "clues:")
    except StopIteration:
        return []
    items: list[dict] = []
    for ln in lines[start + 1 :]:
        if ln and not ln.startswith(" "):  # 들여쓰기가 끝나면 clues: 블록 종료
            break
        kv = re.match(r"\s+(?:-\s+)?(\w+):\s*(.*)$", ln)
        if not kv:
            continue
        if ln.lstrip().startswith("- "):
            items.append({})
        if items:
            items[-1][kv.group(1)] = kv.group(2).strip().strip('"')
    return items


# ── 스테이지 1·2 ──────────────────────────────────────────────────────────────

def load_sources(out_root: Path) -> Sources:
    s = Sources(out_root=out_root)
    catalog = out_root / "catalog.json"
    if catalog.is_file():
        s.catalog = json.loads(catalog.read_text(encoding="utf-8"))
    for f in sorted((out_root / "docs" / "wiki" / "clues").glob("*.md")):
        s.clue_libs[f.stem] = parse_clue_frontmatter(f.read_text(encoding="utf-8"))
    s.patterns = sorted(p.stem for p in (out_root / "docs" / "wiki" / "case-patterns").glob("*.md"))
    s.raw_texts = sorted(p.stem for p in (out_root / "raw_texts").glob("*.txt"))
    s.cleaned = sorted(p.name for p in (out_root / "cleaned_texts").iterdir() if p.is_dir()) \
        if (out_root / "cleaned_texts").is_dir() else []
    return s


def select_candidates(s: Sources) -> list[dict]:
    """clue_type 노드 -> 카드 후보. suit는 라이브러리 파일명이 곧 정답(4파일 = 4슈트)."""
    out = []
    for suit, clues in s.clue_libs.items():
        for c in clues:
            if "id" not in c:
                continue
            out.append({"suit": suit, **c})
    return out


# ── 스테이지 3·4 — LLM 추출 STUB ─────────────────────────────────────────────

def extract_facets(candidate: dict, cid: str, s: Sources, draft: bool) -> list[dict]:
    """원문 기반 얼굴·문맥 태그 추출 — 티켓 14의 심장. 아직 뼈대다.

    확정되면 여기서: candidate가 등장하는 원문 구절을 cleaned_texts/에서 찾고
    (catalog pg_id -> 파일), LLM으로 (frame, meaning, tags)를 뽑아 검증한다.
    태그 어휘는 티켓 12가 확정했고, 추출·검증 절차는 14가 스펙한다.
    """
    if not draft:
        raise NotImplementedError("LLM 추출 절차는 티켓 14 미결 — --emit-draft로 자리표시자 초안만 가능")
    suit = candidate["suit"]
    frame = DRAFT_FRAME[suit]
    return [{
        "key": f"{cid}:{frame}",
        "frame": frame,
        "meaning": candidate.get("label", cid),
        "tags": [],  # TODO(14): 원문 근거로 문맥 태그 부여 — 빈 태그는 '아직 추출 전'의 정직한 표시
        "note": f"{candidate.get('observation', '')} — {candidate.get('inference', '')}".strip(" —"),
    }]


def assemble_cases(s: Sources, clues: dict) -> list[dict]:
    """case_pattern + 카드 풀 -> case 생성. TODO(14): 슬롯 구성·정답 배정·misfit 생성 절차."""
    return []


# ── 스테이지 5 — 검증 (enum은 스키마 파일이 단일 원천) ───────────────────────

def load_schema_enums() -> dict[str, set[str]]:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    return {name: set(schema["$defs"][name]["enum"]) for name in ("tag", "suit", "kind", "frame")}


def validate_pack(pack: dict, enums: dict[str, set[str]]) -> list[str]:
    """datapack.ts validatePack의 핵심 규칙을 미러링한 최소 구조 검증."""
    errs: list[str] = []
    if pack.get("format") != PACK_FORMAT:
        errs.append(f"format != {PACK_FORMAT}")
    if pack.get("formatVersion") != PACK_FORMAT_VERSION:
        errs.append(f"formatVersion != {PACK_FORMAT_VERSION}")
    if not re.match(r"^[a-z][a-z0-9_.-]*$", str(pack.get("id", ""))):
        errs.append("팩 id 네임스페이스 규약 위반")
    for key, clue in pack.get("clues", {}).items():
        path = f"clues.{key}"
        if clue.get("id") != key:
            errs.append(f"{path}: record 키·id 불일치")
        if clue.get("suit") not in enums["suit"]:
            errs.append(f"{path}: 미정의 suit {clue.get('suit')!r}")
        if clue.get("kind") not in enums["kind"]:
            errs.append(f"{path}: 미정의 kind {clue.get('kind')!r}")
        if not set(clue.get("tags", [])) <= enums["tag"]:
            errs.append(f"{path}: 미정의 tag")
        facets = clue.get("facets", [])
        if not facets:
            errs.append(f"{path}: 얼굴이 최소 1개 필요")
        frames_seen = set()
        for f in facets:
            if f.get("frame") not in enums["frame"]:
                errs.append(f"{path}: 미정의 frame {f.get('frame')!r}")
            elif f.get("key") != f"{key}:{f['frame']}":
                errs.append(f"{path}: facet key 규약 위반 ({f.get('key')!r})")
            if f.get("frame") in frames_seen:
                errs.append(f"{path}: facet frame 중복 {f.get('frame')!r}")
            frames_seen.add(f.get("frame"))
            if not set(f.get("tags", [])) <= enums["tag"]:
                errs.append(f"{path}: facet 미정의 tag")
    for i, case in enumerate(pack.get("cases", [])):
        slots = case.get("slots", [])
        if len(case.get("pieces", [])) != len(slots) + 1:
            errs.append(f"cases[{i}]: pieces는 slots+1개여야 한다")
    return errs


# ── 스테이지 6 + CLI ─────────────────────────────────────────────────────────

def build_draft_pack(pack_id: str, s: Sources, id_prefix: str) -> dict:
    """id_prefix가 곧 병합 모드 선택이다 (교차 검증에서 실측한 위험 — 위키 id 49건 중
    일부가 수제 base 카드와 동명이라, 접두사 없인 초안이 base를 **의도치 않게 상쇄**해
    풀 수 없는 case를 만든다). 기본 'wiki.' = 병기(add-alongside), '' = 승격(promotion,
    의도적 상쇄 — 티켓 14의 수제 시드 병합·재생성 절차가 확정된 뒤에만)."""
    clues: dict[str, dict] = {}
    for cand in select_candidates(s):
        cid, suit = f"{id_prefix}{cand['id']}", cand["suit"]
        clues[cid] = {
            "id": cid,
            "name": cand.get("label", cid),
            "suit": suit,
            "kind": DRAFT_KIND[suit],  # TODO(14): LLM이 원문 근거로 확정
            "tags": [],
            "text": cand.get("inference", ""),
            "facets": extract_facets(cand, cid, s, draft=True),
        }
    return {
        "format": PACK_FORMAT,
        "formatVersion": PACK_FORMAT_VERSION,
        "id": pack_id,
        "name": "초안 — 태그·얼굴은 LLM 추출 전 자리표시자",
        "clues": clues,
        "cases": assemble_cases(s, clues),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="OUT 산출물 -> 게임 데이터 팩 변환 파이프라인 (뼈대)")
    ap.add_argument("--out-root", type=Path, default=Path("F:/Project/out"), help="OUT 코어 레포 경로")
    ap.add_argument("--pack-id", default="extracted.wiki", help="산출 팩의 네임스페이스 id")
    ap.add_argument("--out", type=Path, default=REPO_ROOT / "build" / "game-data-pack.draft.json")
    ap.add_argument("--emit-draft", action="store_true",
                    help="자리표시자 얼굴로 초안 팩을 생성·검증·저장 (기본은 인벤토리 리포트만)")
    ap.add_argument("--id-prefix", default="wiki.",
                    help="추출 카드 id 접두사. 기본 'wiki.'=병기 모드(수제 base와 충돌 방지), ''=승격 모드(의도적 상쇄)")
    args = ap.parse_args()

    if not args.out_root.is_dir():
        print(f"[중단] OUT 코어를 찾을 수 없다: {args.out_root}")
        return 2

    s = load_sources(args.out_root)
    cands = select_candidates(s)
    print(f"[1·2] 소스 인벤토리 — {args.out_root}")
    print(f"      catalog {len((s.catalog or {}).get('books', []))}권 | 원문 raw {len(s.raw_texts)}·cleaned {len(s.cleaned)}")
    for suit, clues in s.clue_libs.items():
        print(f"      clue_type [{suit}] {len(clues)}건")
    print(f"      case_pattern {len(s.patterns)}종: {', '.join(s.patterns)}")
    print(f"      카드 후보 합계 {len(cands)}건")

    if not args.emit_draft:
        print("[3·4] LLM 추출·case 생성 — STUB (티켓 14 미결). --emit-draft로 초안 생성 가능.")
        return 0

    pack = build_draft_pack(args.pack_id, s, args.id_prefix)
    errs = validate_pack(pack, load_schema_enums())
    print(f"[5]   스키마 검증 — {'PASS' if not errs else 'FAIL'} (clues {len(pack['clues'])}건)")
    for e in errs[:10]:
        print(f"      ! {e}")
    if errs:
        return 1
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[6]   초안 팩 저장 — {args.out}")
    print("      주의: mod 팩 꼴(clues만)이라 base 팩 위에 병합해야 플레이 가능 (datapack.ts loadPacks).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
