from __future__ import annotations

import copy
import json
import tempfile
import unittest
from hashlib import sha256
from pathlib import Path

from scripts.game_data_pack.adapters import (
    FacetReplayExtractor,
    ReplayCaseAssembler,
    ReplayJsonAdapter,
    ReplayTasteFilter,
)
from scripts.game_data_pack.contracts import (
    canonical_sha256,
    validate_facet_drafts,
    validate_taste_response,
)
from scripts.game_data_pack.cli import main as cli_main
from scripts.game_data_pack.pipeline import build_pack

FIXTURES = Path(__file__).parent / "fixtures" / "extraction"


class FacetDraftContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = json.loads(
            (FIXTURES / "source.json").read_text(encoding="utf-8")
        )
        self.response = json.loads(
            (FIXTURES / "facet-response.json").read_text(encoding="utf-8")
        )
        paragraph = self.source["paragraphs"][0]["text"]
        self.assertEqual(len(paragraph), 27)
        self.assertEqual(
            sha256(paragraph.encode("utf-8")).hexdigest(),
            self.source["sha256"],
        )

    def test_valid_response(self) -> None:
        self.assertEqual(
            validate_facet_drafts(self.source, self.response),
            [],
        )

    def test_rejects_quote_outside_source(self) -> None:
        bad = copy.deepcopy(self.response)
        bad["facets"][0]["evidence"][0]["quote"] = "원문에 없는 문장"
        issues = validate_facet_drafts(self.source, bad)
        self.assertIn("EVIDENCE_MISMATCH", {issue.code for issue in issues})

    def test_rejects_tag_without_rubric_reason(self) -> None:
        bad = copy.deepcopy(self.response)
        bad["facets"][0]["tagReasons"] = {}
        issues = validate_facet_drafts(self.source, bad)
        self.assertIn("TAG_REASON_MISSING", {issue.code for issue in issues})

    def test_rejects_more_than_two_tags(self) -> None:
        bad = copy.deepcopy(self.response)
        bad["facets"][0]["tags"] = ["논리", "신중", "공개"]
        bad["facets"][0]["tagReasons"]["공개"] = "공적 기록이다."
        issues = validate_facet_drafts(self.source, bad)
        self.assertIn("TAG_COUNT_INVALID", {issue.code for issue in issues})

    def test_canonical_hash_ignores_object_key_order(self) -> None:
        self.assertEqual(
            canonical_sha256({"b": 2, "a": 1}),
            canonical_sha256({"a": 1, "b": 2}),
        )

    def test_taste_response_is_strict(self) -> None:
        valid = json.loads(
            (FIXTURES / "taste-response.json").read_text(encoding="utf-8")
        )
        self.assertEqual(validate_taste_response(valid), valid)
        with self.assertRaisesRegex(ValueError, "fields"):
            validate_taste_response({**valid, "commentary": "extra"})


class ReplayAdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = json.loads(
            (FIXTURES / "source.json").read_text(encoding="utf-8")
        )
        self.response = json.loads(
            (FIXTURES / "facet-response.json").read_text(encoding="utf-8")
        )

    def test_facet_replay_reads_canonical_request_file(self) -> None:
        request = {"source": self.source, "candidateId": "fixture.time_gap"}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / f"{canonical_sha256(request)}.facet.json"
            path.write_text(
                json.dumps(self.response, ensure_ascii=False),
                encoding="utf-8",
            )
            adapter = FacetReplayExtractor(
                ReplayJsonAdapter(root, "facet")
            )
            self.assertEqual(adapter.extract(request), self.response)

    def test_taste_replay_rejects_extra_fields(self) -> None:
        request = {"facets": self.response}
        invalid = {
            "decision": "keep",
            "tasteScore": 80,
            "reasons": ["명료하다."],
            "extra": True,
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / f"{canonical_sha256(request)}.taste.json"
            path.write_text(
                json.dumps(invalid, ensure_ascii=False),
                encoding="utf-8",
            )
            adapter = ReplayTasteFilter(
                ReplayJsonAdapter(root, "taste")
            )
            with self.assertRaisesRegex(ValueError, "fields"):
                adapter.decide(request)


class PipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = json.loads(
            (FIXTURES / "source.json").read_text(encoding="utf-8")
        )
        self.response = json.loads(
            (FIXTURES / "facet-response.json").read_text(encoding="utf-8")
        )
        self.taste = json.loads(
            (FIXTURES / "taste-response.json").read_text(encoding="utf-8")
        )
        self.cases = json.loads(
            (FIXTURES / "case-response.json").read_text(encoding="utf-8")
        )

    def test_alongside_prefixes_clue_and_facet_ids(self) -> None:
        pack = build_pack(
            pack_id="extracted.fixture",
            merge_mode="alongside",
            source=self.source,
            facet_response=self.response,
            taste_response=self.taste,
            case_response=self.cases,
            promotion_targets=[],
        )
        self.assertEqual(pack["formatVersion"], 2)
        self.assertEqual(pack["mergeMode"], "alongside")
        clue_id = next(iter(pack["clues"]))
        self.assertEqual(
            clue_id,
            "extracted.fixture.fixture.time_gap",
        )
        self.assertTrue(
            all(
                facet["key"].startswith(f"{clue_id}:")
                for facet in pack["clues"][clue_id]["facets"]
            )
        )

    def test_promotion_requires_exact_target(self) -> None:
        with self.assertRaisesRegex(ValueError, "promotion target"):
            build_pack(
                pack_id="extracted.fixture",
                merge_mode="promotion",
                source=self.source,
                facet_response=self.response,
                taste_response=self.taste,
                case_response=self.cases,
                promotion_targets=[],
            )

    def test_promotion_keeps_source_id(self) -> None:
        pack = build_pack(
            pack_id="extracted.fixture",
            merge_mode="promotion",
            source=self.source,
            facet_response=self.response,
            taste_response=self.taste,
            case_response=self.cases,
            promotion_targets=[{
                "kind": "clue",
                "id": "fixture.time_gap",
                "expectedSourcePack": "base",
            }],
        )
        self.assertIn("fixture.time_gap", pack["clues"])

    def test_output_hash_is_self_reference_stable(self) -> None:
        first = build_pack(
            pack_id="extracted.fixture",
            merge_mode="alongside",
            source=self.source,
            facet_response=self.response,
            taste_response=self.taste,
            case_response=self.cases,
            promotion_targets=[],
        )
        second = build_pack(
            pack_id="extracted.fixture",
            merge_mode="alongside",
            source=self.source,
            facet_response=self.response,
            taste_response=self.taste,
            case_response=self.cases,
            promotion_targets=[],
        )
        self.assertEqual(first, second)
        self.assertRegex(
            first["provenance"]["outputSha256"],
            r"^[a-f0-9]{64}$",
        )

    def test_case_assembler_requires_exact_cases_shape(self) -> None:
        adapter = ReplayCaseAssembler(FIXTURES / "case-response.json")
        self.assertEqual(adapter.assemble({"clues": []}), {"cases": []})
        with tempfile.TemporaryDirectory() as directory:
            invalid = Path(directory) / "invalid.json"
            invalid.write_text('{"cases":[],"extra":true}', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "only cases"):
                ReplayCaseAssembler(invalid).assemble({"clues": []})

    def test_cli_emits_identical_canonical_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            first = root / "first.json"
            second = root / "second.json"
            common = [
                "--out-root",
                str(root),
                "--source",
                str(FIXTURES / "source.json"),
                "--facet-response",
                str(FIXTURES / "facet-response.json"),
                "--taste-response",
                str(FIXTURES / "taste-response.json"),
                "--case-response",
                str(FIXTURES / "case-response.json"),
                "--pack-id",
                "extracted.fixture",
                "--merge-mode",
                "alongside",
            ]
            self.assertEqual(
                cli_main([*common, "--out", first.name]),
                0,
            )
            self.assertEqual(
                cli_main([*common, "--out", second.name]),
                0,
            )
            self.assertEqual(first.read_bytes(), second.read_bytes())
            emitted = json.loads(first.read_text(encoding="utf-8"))
            self.assertEqual(emitted["formatVersion"], 2)


if __name__ == "__main__":
    unittest.main()
